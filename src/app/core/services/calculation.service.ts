import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { RationsResult } from '../models/calculation.model';
import { API_CONFIG, buildUrl } from './api-config';

@Injectable({ providedIn: 'root' })
export class CalculationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly endpoint = buildUrl(this.config.endpoints.calculation, this.config);

  calculate(): Observable<RationsResult> {
    return this.http.get<RationsResult>(this.endpoint);
  }
}
