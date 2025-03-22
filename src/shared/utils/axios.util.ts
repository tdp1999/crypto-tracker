import { AxiosResponse } from 'axios';
import { lastValueFrom, map, Observable } from 'rxjs';

export function axiosObservableToPromise<T = any>(observable: Observable<AxiosResponse<T>>): Promise<T> {
    return lastValueFrom(observable.pipe(map((value) => value.data)));
}
