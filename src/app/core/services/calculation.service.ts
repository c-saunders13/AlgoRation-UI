import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { RationsResult } from '../models/calculation.model';
import { API_CONFIG } from './api-config';

@Injectable({ providedIn: 'root' })
export class CalculationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly endpoint = this.buildUrl(this.config.endpoints.calculation);

  calculate(): Observable<RationsResult> {
    return this.http.get<RationsResult>(this.endpoint);
  }

  private buildUrl(path: string): string {
    return `${this.config.baseUrl}${path}`;
  }
}
