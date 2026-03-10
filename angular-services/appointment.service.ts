
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppointmentService {

  api = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  create(data:any){
    return this.http.post(this.api + '/appointments', data);
  }

  getAll(){
    return this.http.get(this.api + '/appointments');
  }

}
