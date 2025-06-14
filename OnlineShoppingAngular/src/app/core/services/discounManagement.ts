import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class discount_management {

  private baseUrl = 'http://localhost:8080/discount';

  constructor(private http: HttpClient) {}

  createDiscountGroup(payload: { name: string }): Observable<any> {
    console.log("Hi, diss");
    return this.http.post('http://localhost:8080/discount/discountGroup', payload, { responseType: 'text' as 'json' });
}



  getDiscountUserGroupMembers(): Observable<any[]> {
  return this.http.get<any[]>('http://localhost:8080/discount/discountgroupList');
}

 
getUsers(): Observable<any[]> {
  return this.http.get<any[]>('http://localhost:8080/discount/getUsers');
}

assignUsersToGroup(groupId: number, userIds: number[]): Observable<any> {
  const payload = {
    groupId: groupId,
    userIds: userIds
  };
  return this.http.post('http://localhost:8080/discount/assignUsers', payload, { responseType: 'text' });
}


deleteDiscountGroup(groupId: number): Observable<any> {
  return this.http.post('http://localhost:8080/discount/deleteGroup', { groupId }, { responseType: 'text' });
}

updateGroupName(groupId: number, groupName: string): Observable<string> {
  return this.http.put(`${this.baseUrl}/updateName`,
    { id: groupId, name: groupName },
    { responseType: 'text' }
  );
}


 
}
