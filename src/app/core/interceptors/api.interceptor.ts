import { HttpInterceptorFn } from '@angular/common/http';
import {environment} from '@env/environments';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiReq = req.clone({
    url: `${environment.apiUrl}${req.url}`
  });

  return next(apiReq);
};
