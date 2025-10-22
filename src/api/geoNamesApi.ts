import axios from 'axios';
import { locales } from '../common/localization/locales';

const userName = 'dias';

export type GeoName = {
    geonameId: number;
    toponymName: string;
    name: string;
    countryId: number;
    countryCode: string;
    countryName: string;
};
  
type GetGeoNamesResponse = {
    totalResultsCount: number;
    geonames: GeoName[];
};

export const getGeoNames = async (cityName: string) : Promise<GeoName[]> => {
    const queryParamsObject = {
        name: cityName,
        username: userName,
        featureClass: 'P',
        maxRows: '5',
        type: 'json',
        lang: locales.geoNamesLanguageCode,
        cities: 'cities15000'
    };
    const queryParams = new URLSearchParams(queryParamsObject).toString();
    const geonamesUrl = `https://secure.geonames.org/search?${queryParams}`;
    const { data } = await axios.get<GetGeoNamesResponse>(
        geonamesUrl,
        {
            headers: {
                Accept: 'application/json',
            },
        },
    );
    return data.geonames;
}