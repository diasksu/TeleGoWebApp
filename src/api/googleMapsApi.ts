export const getPlaces = async (map: google.maps.Map, placeInput: string) : Promise<google.maps.places.PlaceResult[]> => {
    const service = new google.maps.places.PlacesService(map);
    return new Promise((resolve, reject) => {
        service.textSearch(
        { query: placeInput, location: map.getCenter(), radius: 10000 },
        (res, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && res) {
                    resolve(res);
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resolve([]);
                } else {
                    reject(new Error(`PlacesService failed: ${status}`));
                }
            }
        );
    });
}

export const getPlaceFromCoords = async (latlng: google.maps.LatLngLiteral): Promise<google.maps.places.PlaceResult | null> => {
  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
        resolve(results[0]); // first result is usually the most relevant
      } else {
        console.error("Geocoder failed due to:", status);
        resolve(null);
      }
    });
  });
}