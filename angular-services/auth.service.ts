
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {

  api = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  login(data:any){
    return this.http.post(this.api + '/auth/login', data);
  }

  register(data:any){
    return this.http.post(this.api + '/auth/register', data);
  }

  logout(){
    localStorage.removeItem('token');
  }

}
