import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { Coordinates, ICurrentWeather } from '../interfaces';
import { ICurrentWeatherData } from './icurrent-weather-data';

export interface IWeatherService {
  getCurrentWeather(city: string, country: string): Observable<ICurrentWeather>,
  getCurrentWeatherByCoords(coords: Coordinates): Observable<ICurrentWeather>,
  updateCurrentWeather(search: string | number, country?: string): void
}
@Injectable({
  providedIn: 'root'
})
export class WeatherService implements IWeatherService {
  readonly currentWeather$ = new BehaviorSubject<ICurrentWeather>({
    city: '--',
    country: '--',
    date: new Date(),
    image: '',
    temperature: 0,
    description: ''
  });

  constructor(private httpClient: HttpClient) { }

  getCurrentWeather(search: string | number, country?: string): Observable<ICurrentWeather> {
    let uriParams = new HttpParams();

    if (typeof search === 'string') {
      uriParams = uriParams.set('q', country ? `${search},${country}` : search);
    } else {
      uriParams = uriParams.set('zip', 'search');
    }


    return this.getCurrentWeatherHelper(uriParams);
  }

  getCurrentWeatherByCoords(coords: Coordinates):
    Observable<ICurrentWeather> {
    const uriParams = new HttpParams()
      .set('lat', coords.latitude.toString())
      .set('lon', coords.longitude.toString())
    return this.getCurrentWeatherHelper(uriParams)
  }

  updateCurrentWeather(search: string | number,
    country?: string) {
    this.getCurrentWeather(search, country).subscribe(weather => this.currentWeather$.next(weather))
  }

  private getCurrentWeatherHelper(uriParams: HttpParams): Observable<ICurrentWeather> {
    uriParams = uriParams.set('appid', environment.appId);

    return this.httpClient
      .get<ICurrentWeatherData>(
        `${environment.baseUrl}api.openweathermap.org/data/2.5/weather`,
        { params: uriParams }
      )
      .pipe(map(data => this.transformToICurrentWeather(data)))
  }

  private transformToICurrentWeather(data: ICurrentWeatherData): ICurrentWeather {
    return {
      city: data.name,
      country: data.sys.country,
      date: new Date(data.dt * 1000),
      image: `http://openweathermap.org/img/w/${data.weather[0].icon}.png`,
      temperature: this.convertKelvinToFahrenheit(data.main.temp),
      description: data.weather[0].description,
    }
  }

  private convertKelvinToFahrenheit(kelvin: number): number {
    return kelvin * 9 / 5 - 459.67
  }
}
