export function getFullAddressWithoutCountry(place?: google.maps.places.PlaceResult): string {
    const parts = place?.address_components
        ?.filter(c =>
            !c.types.includes("country") &&
            !c.types.includes("postal_code")
        )
        .map(c => c.long_name.trim())
        .filter(x => x.length > 0)
        .join(", ");

    return parts ?? place?.formatted_address ?? "";
}

export function getStreetShortName(place?: google.maps.places.PlaceResult): string {

    if(place?.name) 
        return place?.name;

    if (!place?.address_components) return "";

    const street = place.address_components.find(c =>
    c.types.includes("route")
    )?.long_name;

    const number = place.address_components.find(c =>
    c.types.includes("street_number")
    )?.long_name;

    if (!street) return "";
    if (!number) return street;

    return `${street} ${number}`;
}

export function getAddressOutput(place?: google.maps.places.PlaceResult) {
    return {
        shortName: getStreetShortName(place),
        fullAddress: getFullAddressWithoutCountry(place)
    };
}

export interface PlaceDto {
  placeId: string;
  address: string;
  shortName: string;
  latitude: number;
  longitude: number;

  city?: string | null;
  district?: string | null;
  country?: string | null;
  phone?: string | null;
  street?: string | null;
  zipCode?: string | null;
  buildingNumber?: string | null;
}

function getComponent(p: google.maps.places.PlaceResult, type: string): string | null {
  return (
    p.address_components
      ?.find(c => c.types.includes(type))
      ?.long_name ?? null
  );
}

export function toPlaceDto(p: google.maps.places.PlaceResult): PlaceDto | null {
  if (!p.place_id || !p.geometry?.location) return null;

  const addressOutput = getAddressOutput(p);

  const street = getComponent(p, "route");
  const buildingNumber = getComponent(p, "street_number");
  const city =
    getComponent(p, "locality") ??
    getComponent(p, "administrative_area_level_2") ??
    null;

  const district =
    getComponent(p, "sublocality") ??
    getComponent(p, "neighborhood") ??
    null;

  const country = getComponent(p, "country");
  const zipCode = getComponent(p, "postal_code");

  return {
    placeId: p.place_id,
    latitude: p.geometry.location.lat(),
    longitude: p.geometry.location.lng(),
    address: addressOutput.fullAddress,
    shortName: addressOutput.shortName,

    // дополнительные поля
    city,
    district,
    country,
    street,
    zipCode,
    buildingNumber,
    phone: p.formatted_phone_number ?? null
  };
}