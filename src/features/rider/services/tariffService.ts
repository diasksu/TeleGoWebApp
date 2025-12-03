import { apiClient } from "../../../api/backend";
import type { TariffRequest, TariffResponse } from "../types";

class TariffService {
    async calculateTariff(
        origin: google.maps.places.PlaceResult,
        destination: google.maps.places.PlaceResult
    ): Promise<TariffResponse> {
        const originLat = origin.geometry?.location?.lat();
        const originLng = origin.geometry?.location?.lng();
        const destLat = destination.geometry?.location?.lat();
        const destLng = destination.geometry?.location?.lng();

        if (originLat === undefined || originLng === undefined || 
            destLat === undefined || destLng === undefined) {
            throw new Error("Invalid coordinates");
        }

        const payload: TariffRequest = {
            origin: {
                place_id: origin.place_id || '',
                latitude: originLat,
                longitude: originLng,
            },
            destination: {
                place_id: destination.place_id || '',
                latitude: destLat,
                longitude: destLng,
            },
        };

        const data = await apiClient.post<TariffResponse>('/api/tariff/calculate', payload);
        return data;
    }
}

export const tariffService = new TariffService();