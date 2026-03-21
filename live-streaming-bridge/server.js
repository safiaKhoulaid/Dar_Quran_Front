const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { PassThrough } = require('stream');

// Configure fluent-ffmpeg to use the locally installed ffmpeg-static binary
ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const RTMP_URL = 'rtmp://localhost:1935/live';

io.on('connection', (socket) => {
    console.log(`[${socket.id}] Socket connected`);

    socket.on('start-stream', (streamKey) => {
        if (!streamKey) {
            socket.emit('bridge-error', 'Stream key is required');
            return;
        }

        console.log(`[${socket.id}] Starting stream to ${RTMP_URL}/${streamKey}`);

        const rtmpDestination = `${RTMP_URL}/${streamKey}`;

        // Create a passthrough stream for feeding chunks into FFmpeg
        socket.inputStream = new PassThrough();

        socket.ffmpegCommand = ffmpeg(socket.inputStream)
            .inputOptions([
                '-c:v libvpx',      // Chrome usually records WebM encoded with VP8/VP9
                '-f webm'
            ])
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputFormat('flv')
            .outputOptions([
                '-preset ultrafast',
                '-tune zerolatency',
                '-g 30',
                '-b:v 2000k',
                '-maxrate 2500k',
                '-bufsize 4000k',
                '-pix_fmt yuv420p',
                '-b:a 128k',
                '-ar 44100'
            ])
            .on('start', (commandLine) => {
                console.log(`[${socket.id}] FFmpeg started with command: ${commandLine}`);
                socket.emit('bridge-ready', 'FFmpeg ready to receive chunks');
            })
            .on('error', (err) => {
                console.error(`[${socket.id}] FFmpeg Error:`, err.message);
                socket.emit('bridge-error', `FFmpeg error: ${err.message}`);
            })
            .on('end', () => {
                console.log(`[${socket.id}] FFmpeg process ended`);
                socket.emit('bridge-ended', 'Stream ended');
            });

        // Execute the command by telling it to save to the RTMP destination
        socket.ffmpegCommand.save(rtmpDestination);
    });

    socket.on('binarystream', (data) => {
        if (socket.inputStream) {
            try {
                socket.inputStream.write(data);
            } catch (err) {
                console.error(`[${socket.id}] Error writing to FFmpeg inputStream:`, err.message);
            }
        }
    });

    socket.on('stop-stream', () => {
        console.log(`[${socket.id}] stop-stream event received`);
        cleanupFfmpeg(socket);
    });

    socket.on('disconnect', () => {
        console.log(`[${socket.id}] Socket disconnected`);
        cleanupFfmpeg(socket);
    });

    function cleanupFfmpeg(socket) {
        if (socket.inputStream) {
            socket.inputStream.end();
            socket.inputStream = null;
        }

        if (socket.ffmpegCommand) {
            console.log(`[${socket.id}] Stopping FFmpeg process`);
            try {
                // Sending SIGKILL to the underlying ffmpeg process to ensure it stops immediately
                if (socket.ffmpegCommand.ffmpegProc) {
                    socket.ffmpegCommand.ffmpegProc.kill('SIGKILL');
                }
            } catch (e) {
                console.error(`[${socket.id}] Error killing FFmpeg process:`, e.message);
            }
            socket.ffmpegCommand = null;
        }
    }
});

const PORT = 9090;
server.listen(PORT, () => {
    console.log(`Node.js Bridge running on port ${PORT}`);
});
