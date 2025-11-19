import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { env } from '../../../env/config';

interface RiderMapProps {
    sheetMinHeight: number; 
    setMap: (map: google.maps.Map) => void;
}

const libraries: ("places" | "marker")[] = ["places", "marker"];

// const mapStyle: google.maps.MapTypeStyle[] = [
//     { elementType: 'geometry', stylers: [{ color: '#212121' }] },
//     { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
//     { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
//     { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#484848' }] },
//     { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f252e' }] },
// ];

const mapStyle: google.maps.MapTypeStyle[] = [
    {"featureType": "administrative", "elementType": "labels", "stylers": [{"color": "#FFFFFF"}, {"visibility": "simplified"}]},
    {"featureType": "landscape.man_made", "elementType": "all", "stylers": [{"visibility": "simplified"}, {"color": "#303030"}]},
    {"featureType": "landscape.natural", "elementType": "geometry", "stylers": [{"color": "#000000"}, {"visibility": "simplified"}]},
    {"featureType": "poi", "elementType": "geometry", "stylers": [{"visibility": "off"}]},
    {"featureType": "poi", "elementType": "labels.text", "stylers": [{"visibility": "simplified"}, {"color": "#FFFFFF"}]},
    {"featureType": "road", "elementType": "geometry", "stylers": [{"visibility": "simplified"}, {"color": "#808080"}]},
    {"featureType": "road", "elementType": "labels.text", "stylers": [{"color": "#FFFFFF"}, {"visibility": "simplified"}]},
    {"featureType": "road", "elementType": "labels.icon", "stylers": [{"visibility": "off"}]},
    {"featureType": "water", "elementType": "all", "stylers": [{"color": "#303030"}]}
];

export default function RiderMap({
    sheetMinHeight,
    setMap
}: RiderMapProps) {

    return <LoadScript
                googleMapsApiKey={env.googleMapsApiKey}
                libraries={libraries}>
                <GoogleMap
                        mapContainerStyle={{ 
                            width: "100%", 
                            height: `calc(100vh - ${sheetMinHeight}px + 16px)`
                        }}
                        zoom={13}
                        onLoad={(map) => {
                            map.setOptions({
                                styles: mapStyle,
                                disableDefaultUI: true,
                                mapTypeControl: false,
                            });
                            return setMap(map);
                        }}
                        options={{
                            // mapId: "8a5f0c4d3a9b1234"
                        }}
                    >
                </GoogleMap>
            </LoadScript>;
}