import { useEffect, useRef } from "react";

//
//
// --- INTERFACES ---
//

export interface CarRoute {
  points: google.maps.LatLng[];
}

export interface UseRealisticCarsConfig {
  maxCars?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  minLifeMs?: number;
  maxLifeMs?: number;
  minSpeedKmh?: number;
  maxSpeedKmh?: number;
  spawnIntervalMs?: number;
  routeRadiusMeters?: number;
}

interface Car {
  marker: google.maps.Marker;

  route: google.maps.LatLng[];
  routeDistance: number; // meters
  speedMps: number; // meters per second

  createdAt: number;
  fadeOutStart: number | null;

  lifeTime: number;
  status: "fade-in" | "running" | "fade-out";

  // animation
  startTime: number;
  traveled: number; // meters traveled from route start
}

//
// --------------------------------------------------------------
// MAIN HOOK
// --------------------------------------------------------------
//

export function useFakeDrivers(
  isActive: boolean,
  config: UseRealisticCarsConfig = {},
  origin?: google.maps.LatLng | null,
  map?: google.maps.Map | null
) {
  const {
    maxCars = 2,
    fadeInMs = 1200,
    fadeOutMs = 1200,
    minLifeMs = 4000,
    maxLifeMs = 9000,
    minSpeedKmh = 20,
    maxSpeedKmh = 30,
    spawnIntervalMs = 3500,
  } = config;

  const carsRef = useRef<Car[]>([]);
  const animationRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRouteRef = useRef<google.maps.LatLng[] | null>(null);
  const routeRadiusMeters = config.routeRadiusMeters || 800;

  //
  // ------- HELPERS -------
  //

  function randomSpeedMps() {
    const kmh = minSpeedKmh + Math.random() * (maxSpeedKmh - minSpeedKmh);
    return (kmh * 1000) / 3600;
  }

  function randomLifetime() {
    return minLifeMs + Math.random() * (maxLifeMs - minLifeMs);
  }

  async function loadRealRoutes(origin: google.maps.LatLng, radius: number) {
    const routes: google.maps.LatLng[][] = [];

    for (let i = 0; i < 10; i++) {
      const route = await loadRealRouteAround(origin, radius);
      if (route) routes.push(route);
    }

    return routes;
  }

  async function loadRealRouteAround(origin: google.maps.LatLng, radius: number) {
    const directions = new google.maps.DirectionsService();

    // две независимые random точки в радиусе
    const start = offsetPoint(origin, radius);
    const end = offsetPoint(origin, radius);

    const result = await directions.route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING,
    });

    if (result?.routes?.[0]?.overview_path) {
      return result.routes[0].overview_path; // реальный polyline
    }

    return null;
  }


  const realRoutesRef = useRef<google.maps.LatLng[][]>([]);

  // create small deviation around origin
  function offsetPoint(origin: google.maps.LatLng, radiusMeters: number) {
    const dx = (Math.random() - 0.5) * radiusMeters * 2;
    const dy = (Math.random() - 0.5) * radiusMeters * 2;

    const lat = origin.lat() + dy / 111320;
    const lng = origin.lng() + dx / (111320 * Math.cos(origin.lat() * (Math.PI / 180)));

    return new google.maps.LatLng(lat, lng);
  }

  function computeRouteDistance(route: google.maps.LatLng[]) {
    let dist = 0;
    for (let i = 0; i < route.length - 1; i++) {
      dist += google.maps.geometry.spherical.computeDistanceBetween(
        route[i],
        route[i + 1]
      );
    }
    return dist;
  }

  function interpolateOnRoute(
    route: google.maps.LatLng[],
    distance: number
  ): google.maps.LatLng {
    let remaining = distance;

    for (let i = 0; i < route.length - 1; i++) {
      const segLen = google.maps.geometry.spherical.computeDistanceBetween(
        route[i],
        route[i + 1]
      );

      if (remaining <= segLen) {
        const t = remaining / segLen;
        const lat = route[i].lat() + (route[i + 1].lat() - route[i].lat()) * t;
        const lng = route[i].lng() + (route[i + 1].lng() - route[i].lng()) * t;
        return new google.maps.LatLng(lat, lng);
      }

      remaining -= segLen;
    }

    return route[route.length - 1];
  }

  function computeHeadingOnRoute(
    route: google.maps.LatLng[],
    distance: number
  ) {
    let remaining = distance;

    for (let i = 0; i < route.length - 1; i++) {
      const segLen = google.maps.geometry.spherical.computeDistanceBetween(
        route[i],
        route[i + 1]
      );

      if (remaining <= segLen) {
        return google.maps.geometry.spherical.computeHeading(
          route[i],
          route[i + 1]
        );
      }
      remaining -= segLen;
    }
    return 0;
  }

  // <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 72 72">
  //   <g transform="rotate(${angle} 36 36)">
  //     <rect x="16" y="6" width="40" height="60" rx="16" ry="16" fill="white" stroke="#b5b5b5"/>
  //   </g>
  // </svg>

  function makeCarIcon(size: number, angle: number): google.maps.Icon {
    const svg = `
      
      <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	      width="${size}" height="${size}" viewBox="0 0 1024 1098.727" enable-background="new 0 0 1024 1098.727" xml:space="preserve">
        <g transform="rotate(${angle} 512 549.3635)">
        <g>
          <g>
            <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="319.2383" y1="858.8516" x2="691.3125" y2="858.8516">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_1_)" d="M689.385,732.286l-108.172,27.182c0,0-47.079,73.012-75.938,135.995
              c-28.858-62.983-75.938-135.995-75.938-135.995l-108.171-27.182c0,0-3.935,71.947-0.562,94.15
              c3.373,22.202,6.745,34.287,9.555,53.96c2.811,19.673,3.373,49.464,16.301,67.17c12.928,17.705,44.124,28.666,68.855,29.51
              c0,0,31.928,9.153,89.96,8.282c58.031,0.871,89.96-8.282,89.96-8.282c24.731-0.844,55.928-11.805,68.855-29.51
              c12.928-17.706,13.49-47.497,16.301-67.17s6.183-31.758,9.556-53.96C693.319,804.233,689.385,732.286,689.385,732.286z"/>
            <path fill="#383838" d="M668.758,886.59c0,0-11.477-50.129-14.864-69.699c-3.386-19.57,11.369-67.46,11.72-68.585
              c0.352-1.124,23.771-16.02,23.771-16.02l0.491,10.011l-7.424,60.72L668.758,886.59z"/>
            <path fill="#C80407" d="M593.789,935.293c1.353-4.122,20.604-32.6,26.717-44.217c4.288-8.149,27.671-69.896,41.248-106.032
              c-0.183,13.968-0.52,27.954,0.354,41.896c1.066,17.033,4.093,33.822,7.312,50.563c1.403,7.306,2.878,14.598,4.38,21.885
              c-0.645,8.551-2.134,16.382-5.041,23.011c-10.047,22.914-49.659,31.507-59.189,28.645S592.439,939.416,593.789,935.293z"/>
            <path fill="#383838" d="M341.792,886.59c0,0,11.478-50.129,14.865-69.699c3.387-19.57-11.369-67.46-11.72-68.585
              c-0.351-1.124-23.771-16.02-23.771-16.02l-0.491,10.011l7.423,60.72L341.792,886.59z"/>
            <path fill="#C80407" d="M416.761,935.293c-1.351-4.122-20.604-32.6-26.716-44.217c-4.288-8.149-27.671-69.896-41.249-106.032
              c0.184,13.968,0.52,27.954-0.354,41.896c-1.067,17.033-4.092,33.822-7.31,50.563c-1.405,7.306-2.879,14.598-4.38,21.885
              c0.644,8.551,2.133,16.382,5.04,23.011c10.047,22.914,49.66,31.507,59.19,28.645S418.112,939.416,416.761,935.293z"/>
            <linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="418.6934" y1="971.709" x2="592.0088" y2="971.709">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="1" style="stop-color:#BDBDBD"/>
            </linearGradient>
            <path fill="url(#SVGID_2_)" d="M420.819,964.893c0,0-3.255,8.529-1.709,10.075c1.545,1.546,24.029,5.34,51.712,7.026
              c27.683,1.686,68.293-0.141,92.323-2.811s29.51-3.935,28.807-8.01c-0.702-4.075-3.372-10.398-3.372-10.398L420.819,964.893z"/>
            <linearGradient id="SVGID_3_" gradientUnits="userSpaceOnUse" x1="505.3765" y1="-118.4331" x2="505.3764" y2="947.4016">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="1" style="stop-color:#BDBDBD"/>
            </linearGradient>
            <path fill="url(#SVGID_3_)" d="M670.223,758.923c0,0,17.959-13.989,19.364-26.637c1.405-12.646,0.562-119.188,0-178.054
              c-0.563-58.866-2.811-226.93-1.687-248.852c0,0,4.497-19.111,6.184-61.83c1.686-42.718-3.936-70.074-7.683-75.694
              c0,0-2.249-37.848-12.366-60.706c-10.118-22.858-21.735-32.226-29.604-36.348c-7.869-4.123-38.222-19.111-73.819-28.479
              c-35.599-9.368-64.729-7.223-64.729-7.223s-30.142-2.145-65.741,7.223c-35.599,9.368-65.951,24.357-73.82,28.479
              c-7.869,4.122-19.486,13.49-29.604,36.348s-12.366,60.706-12.366,60.706c-3.747,5.621-9.368,32.976-7.682,75.694
              c1.686,42.719,6.183,61.83,6.183,61.83c1.125,21.922-1.124,189.986-1.686,248.852c-0.562,58.865-1.405,165.407,0,178.054
              c1.405,12.647,17.85,26.637,17.85,26.637s17.022,145.081,23.475,161.944c6.453,16.862,19.406,18.549,19.406,18.549
              s15.152,22.859,54.872,29.229c39.721,6.369,124.033,4.871,151.764-4.497c27.729-9.367,38.597-25.105,38.597-25.105
              s18.737-7.494,24.357-21.359C657.107,903.817,672.845,801.016,670.223,758.923"/>
            <g>
              <linearGradient id="SVGID_4_" gradientUnits="userSpaceOnUse" x1="509.1274" y1="1001.793" x2="507.6289" y2="863.8932">
                <stop  offset="0.1328" style="stop-color:#272525"/>
                <stop  offset="0.2075" style="stop-color:#515050"/>
                <stop  offset="0.3004" style="stop-color:#7F7E7E"/>
                <stop  offset="0.3968" style="stop-color:#A6A6A6"/>
                <stop  offset="0.4954" style="stop-color:#C7C6C6"/>
                <stop  offset="0.5967" style="stop-color:#DFDFDF"/>
                <stop  offset="0.7019" style="stop-color:#F1F1F1"/>
                <stop  offset="0.8136" style="stop-color:#FCFCFC"/>
                <stop  offset="0.9427" style="stop-color:#FFFFFF"/>
              </linearGradient>
              <path fill="url(#SVGID_4_)" d="M664.394,833.044c-4.38,34.074-9.997,65.071-12.907,72.248
                c-5.62,13.865-24.357,21.359-24.357,21.359s-11.664,14.739-38.409,26.629c-29.978,13.326-106.797,15.177-151.015,6.842
                c-39.532-7.451-55.809-33.098-55.809-33.098s-12.953-1.687-19.406-18.549c-2.726-7.124-7.338-37.128-11.756-69.411
                c-0.56-1.351-1.097-2.708-1.603-4.079c-0.344-0.934-0.662-1.874-0.982-2.814c5.104,38.79,11.076,80.161,14.341,88.696
                c6.453,16.862,19.406,18.549,19.406,18.549s15.152,22.859,54.872,29.229c39.721,6.369,124.033,4.871,151.764-4.497
                c27.729-9.367,38.597-25.105,38.597-25.105s18.737-7.494,24.357-21.359c3.375-8.324,10.393-48.692,14.896-88.74
                C665.734,830.318,665.073,831.688,664.394,833.044z"/>
            </g>
            <g>
              <linearGradient id="SVGID_5_" gradientUnits="userSpaceOnUse" x1="346.9717" y1="846.6318" x2="263.783" y2="849.63">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
              </linearGradient>
              <path fill="url(#SVGID_5_)" d="M341.588,900.445c-0.375-11.992,2.248-35.974,0-61.08c-2.249-25.106-6.745-68.95-8.619-78.317
                c-1.874-9.368-12.294-18.751-12.294-18.751v0.001c-0.937,20.561-2.666,67.062-0.071,84.139c0.267,1.759,0.534,3.434,0.801,5.074
                c3.502,6.697,7.551,14.335,10.722,27.341c6.464,26.514-1.686,41.218,10.961,66.231c8.995,17.79,30.976,23.566,42.927,25.423
                c-4.182-1.096-10.405-3.239-19.598-7.342C342.905,932.672,341.963,912.437,341.588,900.445z"/>
            </g>
            <g>
              <linearGradient id="SVGID_6_" gradientUnits="userSpaceOnUse" x1="624.5361" y1="846.4014" x2="691.3135" y2="846.4014">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
              </linearGradient>
              <path fill="url(#SVGID_6_)" d="M668.962,900.445c0.376-11.992-2.248-35.974,0-61.08s6.745-68.95,8.619-78.317
                c1.874-9.368,12.295-18.751,12.295-18.751v0.001c0.937,20.561,2.665,67.062,0.071,84.139c-0.268,1.759-0.535,3.434-0.801,5.074
                c-3.503,6.697-7.552,14.335-10.723,27.341c-6.464,26.514,1.687,41.218-10.96,66.231c-8.995,17.79-30.977,23.566-42.928,25.423
                c4.182-1.096,10.404-3.239,19.598-7.342C667.646,932.672,668.588,912.437,668.962,900.445z"/>
            </g>
            <g>
              <linearGradient id="SVGID_7_" gradientUnits="userSpaceOnUse" x1="468.272" y1="-82.9937" x2="468.2719" y2="389.4083">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="1" style="stop-color:#BDBDBD"/>
              </linearGradient>
              <path fill="url(#SVGID_7_)" d="M467.871,117.644l0.865-0.568C468,117.403,467.658,117.606,467.871,117.644z"/>
              <linearGradient id="SVGID_8_" gradientUnits="userSpaceOnUse" x1="480.4146" y1="-82.8862" x2="480.4145" y2="389.262">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="1" style="stop-color:#BDBDBD"/>
              </linearGradient>
              <path fill="url(#SVGID_8_)" d="M485.689,105.95l-16.953,11.126c5.045-2.243,28.815-10.341,22.206-11.069
                c-0.772-0.046-1.483-0.087-2.116-0.12C487.889,105.871,486.837,105.894,485.689,105.95z"/>
              <linearGradient id="SVGID_9_" gradientUnits="userSpaceOnUse" x1="506.0239" y1="-82.8896" x2="506.0239" y2="389.267">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="1" style="stop-color:#BDBDBD"/>
              </linearGradient>
              <path fill="url(#SVGID_9_)" d="M687.697,167.857c0,0-2.248-37.848-12.365-60.706c-10.118-22.858-21.735-32.226-29.604-36.348
                c-7.869-4.123-38.222-19.111-73.82-28.479c-35.598-9.368-65.741-7.223-65.741-7.223s-0.024-0.001-0.065-0.004v-0.01
                c-0.031,0.002-0.051,0.003-0.076,0.005c-0.026-0.002-0.045-0.003-0.076-0.005v0.01c-0.041,0.003-0.066,0.004-0.066,0.004
                s-30.142-2.145-65.741,7.223c-35.599,9.368-65.951,24.357-73.82,28.479c-7.869,4.122-19.486,13.49-29.604,36.348
                s-12.366,60.706-12.366,60.706c-3.747,5.621-9.368,32.976-7.682,75.694c1.686,42.719,6.183,61.83,6.183,61.83
                c0.218,4.25,0.309,14.012,0.31,27.39l6.484,9.517c0,0-2.175-110.73,7.038-154.759c9.214-44.028,41.926-60.332,41.926-60.332
                s80.495-19.937,107.079-21.247l0.168-0.11c0.367-0.064,1.439-0.032,2.968,0.047c0.783,0.013,1.493,0.051,2.114,0.119
                c0.001,0,0.001,0,0.002,0c5.844,0.347,15.174,0.969,20.398,0.396c18.547-2.038,104.922,31.8,104.922,31.8
                s49.89,5.298,59.103,49.326s7.038,154.759,7.038,154.759l6.484-9.517c0.001-13.378,0.092-23.139,0.311-27.39
                c0,0,4.496-19.111,6.183-61.83C697.066,200.833,691.444,173.478,687.697,167.857z"/>
            </g>
            <linearGradient id="SVGID_10_" gradientUnits="userSpaceOnUse" x1="417.6069" y1="47.9692" x2="315.648" y2="46.4695">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="1" style="stop-color:#BDBDBD"/>
            </linearGradient>
            <path fill="url(#SVGID_10_)" d="M506.368,49.128l0.006,0.292C506.374,49.42,507.727,49.42,506.368,49.128z"/>
            <linearGradient id="SVGID_11_" gradientUnits="userSpaceOnUse" x1="511.3389" y1="68.8662" x2="511.3388" y2="488.7344">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_11_)" d="M683.338,176.644c-7.119-32.02-26.792-58.438-26.792-58.438l-17.611-6.37
              c0,0-54.149-46.33-127.595-44.993c-73.446-1.337-127.595,44.993-127.595,44.993l-17.612,6.37c0,0-19.673,26.418-26.792,58.438
              c-7.119,32.02,0,105.504,0,105.504c13.678,41.407,35.045,160.944,35.045,160.944c-3.051-58.388-11.895-129.28-11.895-129.28
              l4.025-40.47l125.247-23.487l164.399,23.487l4.026,40.47c0,0-8.845,70.893-11.896,129.28c0,0,21.367-119.537,35.045-160.944
              C683.338,282.148,690.457,208.664,683.338,176.644z"/>
            <linearGradient id="SVGID_12_" gradientUnits="userSpaceOnUse" x1="336.1748" y1="432.0029" x2="686.5116" y2="432.0029">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_12_)" d="M371.433,426.987c1.854,9.963,2.952,16.105,2.952,16.105c-0.379-7.253-0.848-14.7-1.377-22.179
              C372.48,422.938,371.954,424.962,371.433,426.987z"/>
            <linearGradient id="SVGID_13_" gradientUnits="userSpaceOnUse" x1="329.646" y1="548.6279" x2="360.2285" y2="548.6279">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_13_)" d="M329.646,349.081c0,0,0.958,193.042,4.015,282.832c3.057,89.789,8.132,122.863,8.132,122.863
              s21.134-176.969,18.146-226.433c-2.987-49.463-12.348-136.399-12.348-136.399l-2.654-45.895l-4.935-3.569L329.646,349.081z"/>
            <path fill="#383838" d="M339.34,282.148c0,0,1.499,67.075,0,118.413c-1.499,51.338,2.623,133.403,3.747,177.246
              s4.886,127.032,4.504,150.265c-0.382,23.231-1.023,33.724,3.607,44.591c4.63,10.868,6.856,15.738,8.741,13.49
              s11.644-41.968,14.446-64.826c2.802-22.859,7.673-105.673,6.924-134.901c-0.749-29.229-4.872-118.413-9.368-153.637
              c-4.497-35.224-11.241-72.322-18.361-99.677C346.46,305.756,339.181,273.908,339.34,282.148z"/>
            <linearGradient id="SVGID_14_" gradientUnits="userSpaceOnUse" x1="308.0815" y1="440.6777" x2="490.1954" y2="468.4073">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path fill="url(#SVGID_14_)" d="M345.523,357.843c0,0,0.562,175.37,2.061,178.368c1.499,2.999,15.738,9.369,20.235,10.868
              c4.497,1.498,6.371,0.562,6.558-2.811c0.188-3.373-2.811-78.505-8.057-115.228c-5.246-36.723-10.493-69.698-13.49-74.945
              s-6.37-5.621-6.932-4.497C345.336,350.723,345.523,357.843,345.523,357.843z"/>
            <linearGradient id="SVGID_15_" gradientUnits="userSpaceOnUse" x1="306.6348" y1="450.1787" x2="488.7501" y2="477.9086">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path opacity="0.2" fill="url(#SVGID_15_)" d="M363.324,486.589c-2.248-39.551-12.124-78.141-17.759-117.238
              c0.156,39.064,0.754,164.33,2.019,166.86c1.207,2.413,10.659,7.008,16.65,9.492C364.629,525.988,364.443,506.275,363.324,486.589z
              "/>
            <linearGradient id="SVGID_16_" gradientUnits="userSpaceOnUse" x1="280.8491" y1="619.5117" x2="462.9688" y2="647.2422">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path fill="url(#SVGID_16_)" d="M376.813,575.184c0,0-27.167-5.247-28.854-3.561c-1.687,1.687,2.998,95.741,2.623,105.11
              c-0.375,9.368-0.562,12.179,3.56,12.929c4.122,0.75,19.861,3.747,20.048,2.623s3.466-100.802,3.466-107.547
              S378.195,575.445,376.813,575.184z"/>
            <linearGradient id="SVGID_17_" gradientUnits="userSpaceOnUse" x1="267.2163" y1="709.0518" x2="449.3333" y2="736.7819">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path fill="url(#SVGID_17_)" d="M353.908,694.768c0,0,10.398,2.107,14.474,2.811c4.075,0.702,5.761,1.404,5.34,5.761
              c-0.422,4.356-4.356,34.428-6.042,41.313c-1.687,6.886-4.356,5.621-7.729,5.621c-3.373,0-5.621,0.843-6.042-7.026
              c-0.422-7.869-2.249-44.545-2.67-46.794C350.816,694.205,353.908,694.768,353.908,694.768z"/>
            <linearGradient id="SVGID_18_" gradientUnits="userSpaceOnUse" x1="280.8521" y1="619.4922" x2="462.9706" y2="647.2225">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path opacity="0.2" fill="url(#SVGID_18_)" d="M350.582,676.733c-0.375,9.368-0.562,12.179,3.56,12.929
              c1.575,0.287,4.846,0.901,8.297,1.489c3.225-17.93,4.264-36.027,5.091-54.292c0.969-21.392,2.843-42.782-2.376-63.746
              c-7.597-1.242-16.266-2.42-17.195-1.49C346.272,573.31,350.957,667.364,350.582,676.733z"/>
            <linearGradient id="SVGID_19_" gradientUnits="userSpaceOnUse" x1="268.9023" y1="697.9746" x2="451.0237" y2="725.7054">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path opacity="0.2" fill="url(#SVGID_19_)" d="M353.06,726.939c2.758-8.315,5.233-16.723,7.228-25.285
              c0.418-1.793,0.8-3.588,1.167-5.383c-3.85-0.755-7.548-1.504-7.548-1.504s-3.092-0.563-2.67,1.686
              C351.51,697.909,352.372,713.784,353.06,726.939z"/>
            <g>
              <path fill="#282825" d="M380.464,564.742c-17.395-2.455-36.665-9.387-38.205-9.947c-0.109,0-0.216,0.002-0.323,0.002
                c-14.275,0-20.441-5.896-20.716-6.169l0.014-1.385c0.064,0.063,7.085,6.568,21.116,6.427l0.104-0.001l0.097,0.036
                c0.199,0.073,20.149,7.396,38.07,9.924L380.464,564.742z"/>
            </g>
            <linearGradient id="SVGID_20_" gradientUnits="userSpaceOnUse" x1="506.9561" y1="848.8633" x2="505.5064" y2="906.0956">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_20_)" d="M390.584,866.345c0,0-13.771,4.525-14.615,12.661c-0.843,8.136,0.843,45.515,7.307,51.416
              c6.464,5.902,36.627,17.198,84.22,23.233c50.988,6.467,95.367,0.469,128.53-11.615c33.163-12.085,37.379-19.206,38.784-36.631
              s5.059-32.319-8.712-39.064C612.327,859.6,390.584,866.345,390.584,866.345z"/>
            <linearGradient id="SVGID_21_" gradientUnits="userSpaceOnUse" x1="341.7925" y1="946.2422" x2="396.7666" y2="946.2422">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_21_)" d="M341.792,922.397c0,0,3.053,21.571,22.654,35.286s32.32,12.366,32.32,12.366
              S352.229,954.632,341.792,922.397z"/>
            <linearGradient id="SVGID_22_" gradientUnits="userSpaceOnUse" x1="362.7603" y1="960.123" x2="416.7607" y2="960.123">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_22_)" d="M362.76,946.242c0,0,47.215,28.585,50.026,27.742c2.811-0.844,5.621-8.713,2.811-9.274
              C412.786,964.147,370.63,951.663,362.76,946.242z"/>
            
              <linearGradient id="SVGID_23_" gradientUnits="userSpaceOnUse" x1="93.1836" y1="946.2422" x2="148.1572" y2="946.2422" gradientTransform="matrix(-1 0 0 1 764.3838 0)">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_23_)" d="M671.2,922.397c0,0-3.053,21.571-22.653,35.286c-19.602,13.715-32.32,12.366-32.32,12.366
              S660.764,954.632,671.2,922.397z"/>
            
              <linearGradient id="SVGID_24_" gradientUnits="userSpaceOnUse" x1="114.1504" y1="960.123" x2="168.1514" y2="960.123" gradientTransform="matrix(-1 0 0 1 764.3838 0)">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_24_)" d="M650.233,946.242c0,0-47.216,28.585-50.026,27.742c-2.811-0.844-5.621-8.713-2.811-9.274
              C600.207,964.147,642.363,951.663,650.233,946.242z"/>
            <path fill="#383838" d="M349.756,768.755c0,0,6.822,15.524,6.541,36.041s5.34,55.386,8.712,81.794s8.993,39.898,18.268,43.832
              v-3.372c0,0-6.183-6.266-12.366-24.451c-6.182-18.185-9.053-50.868-10.709-72.228c-1.656-21.359-0.79-36.775,2.29-43.682
              c3.08-6.906,7.517-38.398,9.33-49.154c0,0-11.028,38.875-14.119,38.313C354.61,775.286,349.756,768.755,349.756,768.755z"/>
            <path fill="#383838" d="M332.408,688.725c0,0-7.307,0.563-6.745,10.398c0.562,9.837,1.944,31.012,7.998,36.304L332.408,688.725z"
              />
            <path fill="#383838" d="M323.275,495.417c0,0-7.307,0.55-6.745,10.173c0.562,9.623,1.944,30.337,7.998,35.515L323.275,495.417z"/>
            <g>
              
                <linearGradient id="SVGID_25_" gradientUnits="userSpaceOnUse" x1="9.8496" y1="548.6279" x2="40.4321" y2="548.6279" gradientTransform="matrix(-1 0 0 1 691.5967 0)">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
              </linearGradient>
              <path fill="url(#SVGID_25_)" d="M681.747,349.081c0,0-0.959,193.042-4.016,282.832s-8.131,122.863-8.131,122.863
                s-21.134-176.969-18.146-226.433c2.987-49.463,12.348-136.399,12.348-136.399l2.654-45.895l4.935-3.569L681.747,349.081z"/>
              <path fill="#383838" d="M678.985,688.725c0,0,7.307,0.563,6.745,10.398c-0.563,9.837-1.944,31.012-7.999,36.304L678.985,688.725z
                "/>
              <path fill="#383838" d="M688.117,495.417c0,0,7.307,0.55,6.745,10.173c-0.563,9.623-1.943,30.337-7.998,35.515L688.117,495.417z"
                />
            </g>
            <path fill="#383838" d="M284.817,359.904c0,0,4.028,1.545,8.525,0.703c4.497-0.843,46.664-14.558,46.664-14.558
              s4.018-0.484,8.702,3.032c4.684,3.516,7.682,4.454,7.495,3.142c-0.188-1.312-3.795-23.655-11.266-29.697
              s-16.23-1.171-16.839,2.154s-8.899,7.261-8.899,7.261l-24.17,15.457L284.817,359.904z"/>
            <g>
              <linearGradient id="SVGID_26_" gradientUnits="userSpaceOnUse" x1="453.0234" y1="948.0342" x2="329.9537" y2="884.7412">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
              </linearGradient>
              <path fill="url(#SVGID_26_)" d="M381.896,939.416c0,0-12.953-1.687-19.406-18.549c-2.631-6.875-7.018-35.063-11.292-66.041l0,0
                c0,0-6.737,60.803,10.614,85.998c0.432,0.628,0.868,1.222,1.304,1.812c10.884,5.597,23.128,8.467,31.157,8.88
                C385.641,945.058,381.896,939.416,381.896,939.416z"/>
            </g>
            <linearGradient id="SVGID_27_" gradientUnits="userSpaceOnUse" x1="558.0986" y1="743.873" x2="336.0676" y2="745.5593">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path opacity="0.62" fill="url(#SVGID_27_)" d="M383.276,626.333c0,0-4.162,104.562-13.997,142.208s-7.127,59.604-4.855,77.86
              c2.271,18.257,8.613,19.006,11.344,16.945c2.731-2.062,11.298-136.681,10.247-174.622
              C384.963,650.784,383.276,626.333,383.276,626.333z"/>
            
              <linearGradient id="SVGID_28_" gradientUnits="userSpaceOnUse" x1="301.4097" y1="743.8721" x2="79.3786" y2="745.5583" gradientTransform="matrix(-1 0 0 1 755.332 0)">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path opacity="0.54" fill="url(#SVGID_28_)" d="M628.744,626.333c0,0,4.163,104.562,13.997,142.208
              c9.837,37.646,7.127,59.604,4.857,77.86c-2.272,18.257-8.614,19.006-11.346,16.945c-2.731-2.062-11.299-136.681-10.247-174.622
              C627.058,650.784,628.744,626.333,628.744,626.333z"/>
            <g>
              <linearGradient id="SVGID_29_" gradientUnits="userSpaceOnUse" x1="284.8027" y1="342.2871" x2="336.6841" y2="342.2871">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
              </linearGradient>
              <path fill="url(#SVGID_29_)" d="M328.098,324.679c0,0-44.218,6.371-43.281,35.225c0,0,50.4-14.612,51.712-17.424
                C337.841,339.668,330.453,324.26,328.098,324.679z"/>
              <linearGradient id="SVGID_30_" gradientUnits="userSpaceOnUse" x1="284.8135" y1="343.2319" x2="336.6846" y2="343.2319">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
              </linearGradient>
              <path opacity="0.3" fill="url(#SVGID_30_)" d="M284.813,359.426c0.002,0.16-0.001,0.316,0.004,0.478
                c0,0,50.4-14.612,51.712-17.424c1.011-2.166-3.139-11.796-6.176-15.92C313.625,335.236,296.177,346.407,284.813,359.426z"/>
            </g>
            <linearGradient id="SVGID_31_" gradientUnits="userSpaceOnUse" x1="351.4082" y1="265.9048" x2="371.0812" y2="68.6125">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_31_)" d="M329.646,168.794c-0.457-60.037,50.291-99.027,83.645-118.15
              c-23.24,8.226-41.185,17.129-46.97,20.16c-7.869,4.122-19.486,13.49-29.604,36.348s-12.366,60.706-12.366,60.706
              c-3.747,5.621-9.368,32.976-7.682,75.694c1.686,42.719,6.183,61.83,6.183,61.83C315.973,246.921,329.646,168.794,329.646,168.794z
              "/>
            <linearGradient id="SVGID_32_" gradientUnits="userSpaceOnUse" x1="343.3574" y1="82.9526" x2="377.0938" y2="82.9526">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_32_)" d="M377.094,67.653c0,0-16.885,20.481-33.736,30.599C343.357,98.252,365.29,91.015,377.094,67.653z"
              />
            <linearGradient id="SVGID_33_" gradientUnits="userSpaceOnUse" x1="574.5986" y1="3.2427" x2="145.1626" y2="418.4393">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path opacity="0.1" fill="url(#SVGID_33_)" d="M383.745,111.836l-17.612,6.37c0,0-19.673,26.418-26.792,58.438
              c-7.119,32.02,0,105.504,0,105.504c1.835,5.557,3.811,12.53,5.853,20.424c5.349-2.612,13.171-6.54,19.377-9.673l1.945-19.557
              l12.394-2.324c7.371-27.542,22.359-83.508,34.381-128.17c16.619-61.732,74.815-74.138,74.815-74.138l0.417-0.776
              C426.952,74.873,383.745,111.836,383.745,111.836z"/>
            <linearGradient id="SVGID_34_" gradientUnits="userSpaceOnUse" x1="336.1763" y1="222.3154" x2="397.4834" y2="222.3154">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path opacity="0.1" fill="url(#SVGID_34_)" d="M362.491,313.813l0.06-0.602l-7.528-27.69
              c-0.247-50.637,31.046-149.38,42.461-183.694c-8.839,5.819-13.739,10.009-13.739,10.009l-17.612,6.37
              c0,0-19.673,26.418-26.792,58.438c-7.119,32.02,0,105.504,0,105.504l26.491,60.656
              C363.922,325.29,362.491,313.813,362.491,313.813z"/>
            <linearGradient id="SVGID_35_" gradientUnits="userSpaceOnUse" x1="552.1377" y1="251.8232" x2="686.502" y2="251.8232">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path opacity="0.1" fill="url(#SVGID_35_)" d="M650.227,432.489c5.557-30.147,21.91-116.432,33.111-150.34
              c0,0,7.119-73.485,0-105.504c-7.119-32.02-26.792-58.438-26.792-58.438l-17.611-6.37c0,0-34.962-29.903-86.797-40.966
              c33.339,34.555,71.806,96.696,66.998,197.182l37.026,5.29l4.026,40.47c0,0-7.843,62.872-11.306,118.964
              C649.329,432.686,649.776,432.59,650.227,432.489z"/>
            <g>
              <path fill="#939598" d="M356.952,304.257c0,0,10.118,52.461,14.614,83.189c4.497,30.728,11.241,88.061,14.802,148.017
                c3.56,59.955,2.061,167.877,1.686,202.727c-0.375,34.85-2.623,83.188-4.497,103.049c-1.874,19.86-5.478,27.729,5.13,31.477
                c10.608,3.748,55.95,15.365,112.159,16.114s116.164-11.617,124.408-18.362c8.245-6.745,1.125-67.075-2.248-142.395
                c-3.372-75.32-0.375-165.254,2.248-201.228c2.624-35.974,9.517-109.794,21.809-170.5c12.292-60.706,12.439-91.058,0-100.801
                c-12.439-9.743-98.628-25.106-158.208-22.483c-59.581,2.623-123.22,14.8-130.216,32.038
                C351.642,282.336,356.952,304.257,356.952,304.257z"/>
              <linearGradient id="SVGID_36_" gradientUnits="userSpaceOnUse" x1="505.812" y1="800.668" x2="505.812" y2="409.4698">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
              </linearGradient>
              <path fill="url(#SVGID_36_)" d="M386.368,433.537c0,0,134.901-26.98,238.887,0c0,0-17.425,163.005-7.307,313.645
                c0,0-109.045,26.418-225.397,0C392.551,747.182,404.917,606.098,386.368,433.537z"/>
              <linearGradient id="SVGID_37_" gradientUnits="userSpaceOnUse" x1="362.9243" y1="346.0493" x2="647.0635" y2="346.0493">
                <stop  offset="0" style="stop-color:#4D4D4D"/>
                <stop  offset="1" style="stop-color:#000000"/>
              </linearGradient>
              <path fill="url(#SVGID_37_)" d="M503.844,269.408c0,0-59.206,0.749-92.557,7.494s-49.933,13.022-48.246,30.447
                c1.686,17.424,10.96,57.333,14.895,84.594c3.935,27.261,7.308,29.417,11.804,29.604c4.497,0.188,57.895-12.459,106.796-11.054
                c48.901,1.405,93.025,4.215,107.64,8.993s23.608,5.059,25.575-3.654c1.967-8.712,11.804-78.13,15.177-96.398
                c3.372-18.268,5.34-28.385-14.896-35.973C609.798,275.872,535.309,268.312,503.844,269.408z"/>
              <linearGradient id="SVGID_38_" gradientUnits="userSpaceOnUse" x1="362.9243" y1="275.6543" x2="647.0605" y2="275.6543">
                <stop  offset="0" style="stop-color:#4D4D4D"/>
                <stop  offset="1" style="stop-color:#000000"/>
              </linearGradient>
              <path opacity="0.2" fill="url(#SVGID_38_)" d="M363.077,294.844c1.695-13.848,18.128-19.554,48.211-25.638
                c33.351-6.745,92.557-7.494,92.557-7.494c31.464-1.096,105.954,6.464,126.189,14.052c12.077,4.529,16.243,9.96,16.924,17.486
                c0.742-10.297-2.258-17.128-16.924-22.628c-20.235-7.588-94.725-15.148-126.189-14.052c0,0-59.206,0.749-92.557,7.494
                s-49.933,13.022-48.246,30.446C363.052,294.618,363.065,294.735,363.077,294.844z"/>
              <linearGradient id="SVGID_39_" gradientUnits="userSpaceOnUse" x1="361.2388" y1="264.2573" x2="648.7471" y2="264.2573">
                <stop  offset="0" style="stop-color:#4D4D4D"/>
                <stop  offset="1" style="stop-color:#000000"/>
              </linearGradient>
              <path opacity="0.2" fill="url(#SVGID_39_)" d="M361.392,283.448c1.715-13.848,18.343-19.554,48.784-25.638
                c33.747-6.745,93.655-7.494,93.655-7.494c31.837-1.096,107.211,6.464,127.687,14.052c12.221,4.529,16.437,9.961,17.125,17.487
                c0.751-10.297-2.285-17.129-17.125-22.628c-20.476-7.588-95.85-15.148-127.687-14.052c0,0-59.908,0.75-93.655,7.495
                c-33.747,6.745-50.525,13.022-48.819,30.446C361.367,283.222,361.381,283.339,361.392,283.448z"/>
              <linearGradient id="SVGID_40_" gradientUnits="userSpaceOnUse" x1="393.729" y1="816.8906" x2="619.2939" y2="816.8906">
                <stop  offset="0" style="stop-color:#4D4D4D"/>
                <stop  offset="1" style="stop-color:#000000"/>
              </linearGradient>
              <path fill="url(#SVGID_40_)" d="M396.298,758.923c0,0-1.125,59.083-1.874,74.071c-0.749,14.989-4.497,30.354,17.987,35.226
                s63.329,12.366,104.174,10.491c40.846-1.873,73.072-5.995,86.563-11.241s15.738-10.492,16.112-25.106
                c0.375-14.614-2.436-72.136-2.436-79.443c0-7.307-3.935-9.181-14.614-6.933c-10.68,2.249-72.791,11.432-108.202,9.885
                c-35.412-1.547-73.165-7.636-81.596-8.947C403.98,755.614,396.436,751.919,396.298,758.923z"/>
              <linearGradient id="SVGID_41_" gradientUnits="userSpaceOnUse" x1="441.7212" y1="346.0493" x2="647.0635" y2="346.0493">
                <stop  offset="0" style="stop-color:#4D4D4D"/>
                <stop  offset="1" style="stop-color:#000000"/>
              </linearGradient>
              <path opacity="0.88" fill="url(#SVGID_41_)" d="M630.033,283.46c-20.235-7.588-94.725-15.148-126.189-14.052
                c0,0-31.946,0.404-62.123,3.292c31.497,23.597,87.385,71.304,134.242,142.149c12.776,1.281,22.644,2.815,28.214,4.636
                c14.614,4.778,23.608,5.059,25.575-3.654c1.967-8.712,11.804-78.13,15.177-96.398
                C648.301,301.166,650.269,291.048,630.033,283.46z"/>
              <path fill="#FFFFFF" d="M405.479,435.223c0,0,111.293-23.607,206.848,0C612.327,435.223,458.18,427.476,405.479,435.223z"/>
              <linearGradient id="SVGID_42_" gradientUnits="userSpaceOnUse" x1="505.3691" y1="890.3281" x2="518.1094" y2="692.473">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
              </linearGradient>
              <path opacity="0.04" fill="url(#SVGID_42_)" d="M507.508,816.891c0,0-95.221-0.942-100.372,20.227
                c-6.383,26.229,74.611,33.041,142.281,26.229C617.088,856.534,658.593,821.406,507.508,816.891z"/>
            </g>
            
              <linearGradient id="SVGID_43_" gradientUnits="userSpaceOnUse" x1="459.2539" y1="222.3154" x2="520.5615" y2="222.3154" gradientTransform="matrix(-1 0 0 1 1145.7422 0)">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path opacity="0.1" fill="url(#SVGID_43_)" d="M660.173,313.813l-0.06-0.602l7.529-27.69
              c0.246-50.637-31.047-149.38-42.462-183.694c8.84,5.819,13.738,10.009,13.738,10.009l17.612,6.37c0,0,19.673,26.418,26.793,58.438
              c7.119,32.02,0,105.504,0,105.504l-26.491,60.656C658.741,325.29,660.173,313.813,660.173,313.813z"/>
            
              <linearGradient id="SVGID_44_" gradientUnits="userSpaceOnUse" x1="529.4727" y1="82.9526" x2="563.209" y2="82.9526" gradientTransform="matrix(-1 0 0 1 1191.3945 0)">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_44_)" d="M628.186,67.653c0,0,16.885,20.481,33.736,30.599C661.922,98.252,639.989,91.015,628.186,67.653z"
              />
            <g>
              <path fill="#383838" d="M672.705,282.148c0,0-1.499,67.075,0,118.413c1.5,51.338-2.622,133.403-3.746,177.246
                c-1.125,43.843-4.887,127.032-4.505,150.265c0.382,23.231,1.023,33.724-3.606,44.591c-4.629,10.868-6.855,15.738-8.74,13.49
                c-1.886-2.248-11.646-41.968-14.446-64.826c-2.802-22.859-7.674-105.673-6.925-134.901c0.75-29.229,4.871-118.413,9.368-153.637
                c4.497-35.224,11.241-72.322,18.362-99.677C665.586,305.756,672.865,273.908,672.705,282.148z"/>
              
                <linearGradient id="SVGID_45_" gradientUnits="userSpaceOnUse" x1="-21.7417" y1="440.6777" x2="160.3691" y2="468.4069" gradientTransform="matrix(-1 0 0 1 682.2227 0)">
                <stop  offset="0" style="stop-color:#4D4D4D"/>
                <stop  offset="1" style="stop-color:#000000"/>
              </linearGradient>
              <path fill="url(#SVGID_45_)" d="M666.522,357.843c0,0-0.562,175.37-2.061,178.368c-1.498,2.999-15.738,9.369-20.235,10.868
                c-4.496,1.498-6.37,0.562-6.557-2.811c-0.188-3.373,2.81-78.505,8.056-115.228c5.246-36.723,10.493-69.698,13.49-74.945
                c2.998-5.247,6.37-5.621,6.933-4.497C666.71,350.723,666.522,357.843,666.522,357.843z"/>
              
                <linearGradient id="SVGID_46_" gradientUnits="userSpaceOnUse" x1="-48.9775" y1="619.5117" x2="133.1462" y2="647.2429" gradientTransform="matrix(-1 0 0 1 682.2227 0)">
                <stop  offset="0" style="stop-color:#4D4D4D"/>
                <stop  offset="1" style="stop-color:#000000"/>
              </linearGradient>
              <path fill="url(#SVGID_46_)" d="M635.233,575.184c0,0,27.168-5.247,28.854-3.561c1.686,1.687-3,95.741-2.624,105.11
                c0.375,9.368,0.562,12.179-3.56,12.929c-4.122,0.75-19.861,3.747-20.048,2.623s-3.466-100.802-3.466-107.547
                S633.852,575.445,635.233,575.184z"/>
              
                <linearGradient id="SVGID_47_" gradientUnits="userSpaceOnUse" x1="-62.6108" y1="709.0518" x2="119.5136" y2="736.783" gradientTransform="matrix(-1 0 0 1 682.2227 0)">
                <stop  offset="0" style="stop-color:#4D4D4D"/>
                <stop  offset="1" style="stop-color:#000000"/>
              </linearGradient>
              <path fill="url(#SVGID_47_)" d="M658.139,694.768c0,0-10.398,2.107-14.474,2.811c-4.075,0.702-5.762,1.404-5.34,5.761
                c0.421,4.356,4.355,34.428,6.042,41.313s4.356,5.621,7.729,5.621c3.373,0,5.621,0.843,6.043-7.026s2.248-44.545,2.67-46.794
                C661.23,694.205,658.139,694.768,658.139,694.768z"/>
              <g>
                <path fill="#282825" d="M631.581,564.742c17.395-2.455,36.665-9.387,38.205-9.947c0.109,0,0.217,0.002,0.323,0.002
                  c14.274,0,20.44-5.896,20.715-6.169l-0.014-1.385c-0.064,0.063-7.085,6.568-21.116,6.427l-0.104-0.001l-0.097,0.036
                  c-0.198,0.073-20.149,7.396-38.069,9.924L631.581,564.742z"/>
              </g>
              <path fill="#383838" d="M727.229,359.904c0,0-4.028,1.545-8.525,0.703c-4.496-0.843-46.663-14.558-46.663-14.558
                s-4.018-0.484-8.702,3.032c-4.685,3.516-7.682,4.454-7.495,3.142c0.188-1.312,3.795-23.655,11.266-29.697
                s16.23-1.171,16.839,2.154c0.609,3.326,8.9,7.261,8.9,7.261l24.17,15.457L727.229,359.904z"/>
              
                <linearGradient id="SVGID_48_" gradientUnits="userSpaceOnUse" x1="-45.0205" y1="342.2871" x2="6.8618" y2="342.2871" gradientTransform="matrix(-1 0 0 1 682.2227 0)">
                <stop  offset="0" style="stop-color:#FFFFFF"/>
                <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
              </linearGradient>
              <path fill="url(#SVGID_48_)" d="M683.947,324.679c0,0,44.219,6.371,43.281,35.225c0,0-50.399-14.612-51.713-17.424
                C674.205,339.668,681.594,324.26,683.947,324.679z"/>
              <g>
                
                  <linearGradient id="SVGID_49_" gradientUnits="userSpaceOnUse" x1="19.4736" y1="450.1782" x2="201.5929" y2="477.9087" gradientTransform="matrix(-1 0 0 1 724.958 0)">
                  <stop  offset="0" style="stop-color:#4D4D4D"/>
                  <stop  offset="1" style="stop-color:#000000"/>
                </linearGradient>
                <path opacity="0.2" fill="url(#SVGID_49_)" d="M648.793,486.589c2.247-39.551,12.123-78.141,17.76-117.238
                  c-0.156,39.064-0.756,164.33-2.021,166.86c-1.205,2.413-10.657,7.008-16.649,9.492
                  C647.487,525.988,647.674,506.275,648.793,486.589z"/>
                
                  <linearGradient id="SVGID_50_" gradientUnits="userSpaceOnUse" x1="-6.3071" y1="619.4922" x2="175.8115" y2="647.2225" gradientTransform="matrix(-1 0 0 1 724.958 0)">
                  <stop  offset="0" style="stop-color:#4D4D4D"/>
                  <stop  offset="1" style="stop-color:#000000"/>
                </linearGradient>
                <path opacity="0.2" fill="url(#SVGID_50_)" d="M661.535,676.733c0.374,9.368,0.563,12.179-3.561,12.929
                  c-1.575,0.287-4.847,0.901-8.297,1.489c-3.226-17.93-4.264-36.027-5.091-54.292c-0.97-21.392-2.844-42.782,2.376-63.746
                  c7.597-1.242,16.265-2.42,17.195-1.49C665.844,573.31,661.16,667.364,661.535,676.733z"/>
                
                  <linearGradient id="SVGID_51_" gradientUnits="userSpaceOnUse" x1="-18.2559" y1="697.9756" x2="163.8655" y2="725.7064" gradientTransform="matrix(-1 0 0 1 724.958 0)">
                  <stop  offset="0" style="stop-color:#4D4D4D"/>
                  <stop  offset="1" style="stop-color:#000000"/>
                </linearGradient>
                <path opacity="0.2" fill="url(#SVGID_51_)" d="M659.057,726.939c-2.758-8.315-5.232-16.723-7.229-25.285
                  c-0.417-1.793-0.799-3.588-1.167-5.383c3.851-0.755,7.548-1.504,7.548-1.504s3.091-0.563,2.67,1.686
                  C660.606,697.909,659.746,713.784,659.057,726.939z"/>
              </g>
              <g>
                
                  <linearGradient id="SVGID_52_" gradientUnits="userSpaceOnUse" x1="-84.7861" y1="342.2871" x2="-32.9038" y2="342.2871" gradientTransform="matrix(-1 0 0 1 642.457 0)">
                  <stop  offset="0" style="stop-color:#FFFFFF"/>
                  <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                  <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
                </linearGradient>
                <path fill="url(#SVGID_52_)" d="M683.947,324.679c0,0,44.219,6.371,43.281,35.225c0,0-50.399-14.612-51.713-17.424
                  C674.205,339.668,681.594,324.26,683.947,324.679z"/>
                
                  <linearGradient id="SVGID_53_" gradientUnits="userSpaceOnUse" x1="-84.7754" y1="343.2319" x2="-32.9038" y2="343.2319" gradientTransform="matrix(-1 0 0 1 642.457 0)">
                  <stop  offset="0" style="stop-color:#FFFFFF"/>
                  <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                  <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
                </linearGradient>
                <path opacity="0.3" fill="url(#SVGID_53_)" d="M727.232,359.426c-0.002,0.16,0.001,0.316-0.004,0.478
                  c0,0-50.399-14.612-51.713-17.424c-1.01-2.166,3.141-11.796,6.177-15.92C698.421,335.236,715.869,346.407,727.232,359.426z"/>
              </g>
            </g>
            <linearGradient id="SVGID_54_" gradientUnits="userSpaceOnUse" x1="501.8765" y1="19.4331" x2="501.8765" y2="82.6508">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
              <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
            </linearGradient>
            <path fill="url(#SVGID_54_)" d="M386.821,80.948c0,0,48.483-37.519,120.154-37.728c77.811-0.228,115.719,39.732,115.719,39.732
              S555.275,51.376,515.93,50.644c-39.347-0.731-89.344,10.826-118.446,32.309C368.381,104.435,386.821,80.948,386.821,80.948z"/>
            <linearGradient id="SVGID_55_" gradientUnits="userSpaceOnUse" x1="498.6548" y1="24.8716" x2="498.6548" y2="91.9057">
              <stop  offset="0" style="stop-color:#4D4D4D"/>
              <stop  offset="1" style="stop-color:#000000"/>
            </linearGradient>
            <path opacity="0.29" fill="url(#SVGID_55_)" d="M379.389,101.827c0,0,44.738-35.607,112.704-43.765
              C560.06,49.905,617.921,89.68,617.921,89.68s-44.378-34.615-103.585-39.486c0,0-32.6-3.33-107.92,28.5L379.389,101.827z"/>
            <g>
              <path fill="#707070" d="M400.79,86.534c0,0,50.482-30.568,106.184-35.89v-3.448c0,0-85.099,11.719-138.079,48.506L400.79,86.534z
                "/>
              <path fill="#707070" d="M613.159,86.534c0,0-50.482-30.568-106.185-35.89v-3.448c0,0,85.1,11.719,138.079,48.506L613.159,86.534z
                "/>
              <g>
                <path fill="#707070" d="M335.593,185.094c0,0-1.023-44.592,3.423-53.96c4.446-9.368,31.801-41.22,52.036-52.836
                  c20.235-11.616,30.025-10.82,32.235-10.497c0,0-1.133,5.439-10.876,11.434s-28.479,17.612-28.479,20.984
                  s-0.188,11.617-0.188,11.617s-14.801,11.242-21.171,25.481s-5.808,26.419-12.928,36.349
                  C342.525,183.595,335.681,191.839,335.593,185.094z"/>
                <linearGradient id="SVGID_56_" gradientUnits="userSpaceOnUse" x1="337.5361" y1="126.9434" x2="419.6831" y2="126.9434">
                  <stop  offset="0" style="stop-color:#FFFFFF"/>
                  <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                  <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
                </linearGradient>
                <path fill="url(#SVGID_56_)" d="M417.514,69.001c-2.405,0.324-9.698,2.051-25.435,11.085
                  c-19.917,11.434-47.17,43.444-51.199,51.931c-3.142,6.62-3.538,34.792-3.277,50.394l0.047,2.765l1.896-2.012
                  c2.087-2.215,4.921-5.815,8.423-10.701c3.775-5.264,5.269-11.236,6.998-18.15c1.341-5.362,2.862-11.44,5.724-17.838
                  c5.549-12.403,17.18-22.525,20.612-25.332l0.401-0.328l0.011-0.518c0.046-2.192,0.155-7.562,0.155-10.078
                  c0-2.992,4.695-7.501,29.46-22.741c4.537-2.792,6.487-5.258,7.326-6.835l1.027-1.933L417.514,69.001z"/>
                <linearGradient id="SVGID_57_" gradientUnits="userSpaceOnUse" x1="339.9375" y1="108.4478" x2="394.5469" y2="108.4478">
                  <stop  offset="0" style="stop-color:#FFFFFF"/>
                  <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                  <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
                </linearGradient>
                <path fill="url(#SVGID_57_)" d="M394.547,78.693c-0.803,0.447-1.617,0.905-2.468,1.394
                  c-19.917,11.434-47.17,43.444-51.199,51.931c-0.347,0.732-0.659,1.74-0.942,2.951c4.553,3.116,10.237,4.795,16.273,1.224
                  c14.248-8.431,8.213-25.856,8.213-25.856C372.375,106.78,386.779,88.887,394.547,78.693z"/>
                <linearGradient id="SVGID_58_" gradientUnits="userSpaceOnUse" x1="298.6758" y1="162.2681" x2="376.803" y2="156.9284">
                  <stop  offset="0" style="stop-color:#FFFFFF"/>
                  <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                  <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
                </linearGradient>
                <path opacity="0.4" fill="url(#SVGID_58_)" d="M347.959,144.2c-1.785-1.209-5.449-1.457-9.221-1.318
                  c-0.974,9.543-1.239,22.871-1.198,33.378C347.407,167.61,351.411,146.54,347.959,144.2z"/>
              </g>
              <g>
                <path fill="#707070" d="M678.355,185.094c0,0,1.022-44.592-3.424-53.96c-4.446-9.368-31.8-41.22-52.034-52.836
                  c-20.235-11.616-30.026-10.82-32.235-10.497c0,0,1.133,5.439,10.876,11.434c9.742,5.995,28.478,17.612,28.478,20.984
                  s0.188,11.617,0.188,11.617s14.801,11.242,21.171,25.481s5.809,26.419,12.928,36.349
                  C671.423,183.595,678.268,191.839,678.355,185.094z"/>
                
                  <linearGradient id="SVGID_59_" gradientUnits="userSpaceOnUse" x1="162.6152" y1="126.9434" x2="244.7617" y2="126.9434" gradientTransform="matrix(-1 0 0 1 839.0273 0)">
                  <stop  offset="0" style="stop-color:#FFFFFF"/>
                  <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                  <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
                </linearGradient>
                <path fill="url(#SVGID_59_)" d="M596.436,69.001c2.404,0.324,9.697,2.051,25.434,11.085
                  c19.918,11.434,47.172,43.444,51.2,51.931c3.142,6.62,3.538,34.792,3.276,50.394l-0.046,2.765l-1.897-2.012
                  c-2.086-2.215-4.92-5.815-8.422-10.701c-3.775-5.264-5.27-11.236-6.999-18.15c-1.34-5.362-2.862-11.44-5.723-17.838
                  c-5.55-12.403-17.181-22.525-20.613-25.332l-0.401-0.328l-0.011-0.518c-0.047-2.192-0.155-7.562-0.155-10.078
                  c0-2.992-4.695-7.501-29.46-22.741c-4.536-2.792-6.488-5.258-7.326-6.835l-1.026-1.933L596.436,69.001z"/>
                
                  <linearGradient id="SVGID_60_" gradientUnits="userSpaceOnUse" x1="165.0166" y1="108.4478" x2="219.626" y2="108.4478" gradientTransform="matrix(-1 0 0 1 839.0273 0)">
                  <stop  offset="0" style="stop-color:#FFFFFF"/>
                  <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                  <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
                </linearGradient>
                <path fill="url(#SVGID_60_)" d="M619.401,78.693c0.803,0.447,1.617,0.905,2.468,1.394c19.918,11.434,47.172,43.444,51.2,51.931
                  c0.347,0.732,0.659,1.74,0.941,2.951c-4.553,3.116-10.237,4.795-16.272,1.224c-14.248-8.431-8.213-25.856-8.213-25.856
                  C641.573,106.78,627.17,88.887,619.401,78.693z"/>
                
                  <linearGradient id="SVGID_61_" gradientUnits="userSpaceOnUse" x1="123.7549" y1="162.2681" x2="201.8821" y2="156.9284" gradientTransform="matrix(-1 0 0 1 839.0273 0)">
                  <stop  offset="0" style="stop-color:#FFFFFF"/>
                  <stop  offset="0.5474" style="stop-color:#BDBDBD"/>
                  <stop  offset="0.9396" style="stop-color:#F1F2F2"/>
                </linearGradient>
                <path opacity="0.4" fill="url(#SVGID_61_)" d="M665.989,144.2c1.785-1.209,5.449-1.457,9.222-1.318
                  c0.974,9.543,1.238,22.871,1.196,33.378C666.541,167.61,662.537,146.54,665.989,144.2z"/>
              </g>
            </g>
            <path fill="#939598" d="M381.715,110.297c0,0,3.124-2.703,9.046-6.836c5.921-4.117,14.629-9.708,25.722-15.234
              c11.076-5.521,24.504-11.073,39.477-15.105c14.951-4.055,31.411-6.609,47.958-6.873l6.2,0.033
              c2.098-0.002,4.123,0.191,6.182,0.276c2.051,0.111,4.097,0.221,6.137,0.332c1.021,0.062,2.04,0.097,3.056,0.179
              c1.016,0.111,2.03,0.222,3.041,0.332c2.024,0.222,4.04,0.442,6.046,0.662c2.006,0.219,4.006,0.408,5.966,0.775
              c1.968,0.323,3.923,0.645,5.863,0.964c1.937,0.342,3.879,0.575,5.762,1.037c1.893,0.414,3.769,0.825,5.627,1.231
              c1.853,0.433,3.715,0.746,5.499,1.291c1.798,0.497,3.575,0.988,5.33,1.474c1.75,0.505,3.506,0.913,5.179,1.51
              c1.687,0.557,3.349,1.105,4.986,1.646c1.636,0.545,3.26,1.045,4.807,1.676c1.56,0.598,3.092,1.186,4.597,1.763
              c0.752,0.289,1.497,0.575,2.234,0.857c0.732,0.297,1.444,0.625,2.155,0.93c5.702,2.419,10.821,4.889,15.232,7.307
              c1.104,0.603,2.173,1.186,3.203,1.749c1.025,0.574,1.985,1.176,2.923,1.729c0.934,0.56,1.828,1.098,2.683,1.611
              c0.836,0.543,1.634,1.061,2.391,1.553c3.034,1.957,5.313,3.649,6.854,4.814c1.535,1.176,2.313,1.853,2.313,1.853
              s-0.791-0.663-2.343-1.813c-1.561-1.139-3.864-2.792-6.928-4.695c-0.764-0.478-1.568-0.982-2.412-1.511
              c-0.862-0.498-1.764-1.02-2.704-1.563c-0.945-0.535-1.913-1.121-2.946-1.676c-1.037-0.544-2.113-1.108-3.224-1.691
              c-2.201-1.207-4.635-2.314-7.176-3.521c-2.519-1.258-5.281-2.328-8.11-3.561c-0.713-0.298-1.424-0.618-2.157-0.906
              c-0.738-0.275-1.483-0.553-2.235-0.833c-1.505-0.561-3.038-1.133-4.597-1.714c-1.547-0.614-3.171-1.097-4.806-1.625
              c-1.637-0.523-3.298-1.055-4.981-1.594c-1.672-0.578-3.426-0.969-5.172-1.456c-1.753-0.466-3.527-0.939-5.321-1.417
              c-3.598-0.912-7.328-1.618-11.09-2.46c-1.877-0.455-3.813-0.68-5.742-1.015c-1.934-0.312-3.881-0.626-5.841-0.942
              c-1.953-0.36-3.94-0.541-5.934-0.752c-1.993-0.212-3.997-0.425-6.008-0.639c-1.006-0.107-2.013-0.215-3.021-0.322
              c-1.015-0.079-2.035-0.111-3.056-0.169c-2.04-0.104-4.087-0.208-6.138-0.313c-2.043-0.079-4.123-0.267-6.145-0.256l-6.163-0.017
              c-16.449,0.211-32.829,2.7-47.723,6.69c-14.91,3.97-28.361,9.305-39.451,14.73c-11.103,5.419-19.922,10.787-25.895,14.823
              C384.884,107.646,381.715,110.297,381.715,110.297z"/>
          </g>
          <g>
            
              <linearGradient id="SVGID_62_" gradientUnits="userSpaceOnUse" x1="513.4521" y1="668.8994" x2="513.4521" y2="699.0081" gradientTransform="matrix(0.9981 0.0623 -0.0623 0.9981 42.7705 -29.4287)">
              <stop  offset="0" style="stop-color:#FFFFFF"/>
              <stop  offset="1" style="stop-color:#BDBDBD"/>
            </linearGradient>
            <path fill="url(#SVGID_62_)" d="M528.051,692.968c0.029-0.497,0.047-0.98,0.037-1.424c-0.017-0.74-0.175-1.467-0.423-2.176
              c-1.343-7.665-4.675-13.983-7.951-15.126c-3.566-1.245-14.458-1.926-17.597,0.941c-2.75,2.514-5.322,10.52-5.837,16.132
              c-0.028,0.257-0.046,0.521-0.054,0.785c-0.03,0.498-0.047,0.98-0.038,1.424c0.016,0.74,0.175,1.468,0.424,2.176
              c1.342,7.665,4.674,13.983,7.951,15.126c3.566,1.246,14.458,1.927,17.596-0.94c2.751-2.515,5.321-10.521,5.837-16.133
              C528.025,693.496,528.043,693.233,528.051,692.968z"/>
          </g>
          <linearGradient id="SVGID_63_" gradientUnits="userSpaceOnUse" x1="511.1743" y1="710.46" x2="511.1743" y2="677.6278">
            <stop  offset="0" style="stop-color:#FFFFFF"/>
            <stop  offset="1" style="stop-color:#BDBDBD"/>
          </linearGradient>
          <path fill="url(#SVGID_63_)" d="M515.836,704.089c0,2.483-2.014,4.497-4.497,4.497h-0.331c-2.483,0-4.497-2.014-4.497-4.497
            v-21.172c0-2.483,2.013-4.496,4.497-4.496h0.331c2.483,0,4.497,2.013,4.497,4.496V704.089z"/>
        </g>
        </g>
        </svg>

    `;
    return {
      url: `data:image/svg+xml;base64,${btoa(svg)}`,
      scaledSize: new google.maps.Size(size, size), 
      anchor: new google.maps.Point(size / 2, size / 2),
    };
  }

  //
  // ------- SPAWN CAR -------
  //

  function getRandomRouteAvoidingLast(
    routes: google.maps.LatLng[][],
    lastRoute: google.maps.LatLng[] | null
  ) {
    if (routes.length === 1) return routes[0]; // fallback

    let route: google.maps.LatLng[];
    let attempts = 0;

    do {
      route = routes[Math.floor(Math.random() * routes.length)];
      attempts++;

      if (attempts > 10) break; // fallback safety
    } while (lastRoute && route === lastRoute);

    return route;
  }

  function spawnCar() {
    if (!origin || !map) return;
    if (carsRef.current.length >= maxCars) return;

    const routes = realRoutesRef.current;
    if (!routes.length) return;

    // выбираем маршрут, не равный предыдущему
    const route = getRandomRouteAvoidingLast(routes, lastRouteRef.current);
    lastRouteRef.current = route;

    const routeDistance = computeRouteDistance(route);
    const startPos = route[0];

    const marker = new google.maps.Marker({
      map,
      position: startPos,
      opacity: 0,
      icon: makeCarIcon(46, 0),
    });

    const now = performance.now();

    const car: Car = {
      marker,
      route,
      routeDistance,
      speedMps: randomSpeedMps(),

      createdAt: now,
      fadeOutStart: null,
      lifeTime: randomLifetime(),
      status: "fade-in",

      startTime: now,
      traveled: 0,
    };

    carsRef.current.push(car);
  }

  //
  // ------- ANIMATION LOOP -------
  //

  function animateFrame() {
    const now = performance.now();
    const toRemove: Car[] = [];

    for (const car of carsRef.current) {
      const age = now - car.createdAt;

      //
      // === 1. ДВИЖЕНИЕ — ВСЕГДА, НЕЗАВИСИМО ОТ СТАТУСА ===
      //
      const dt = now - car.startTime;
      car.traveled = (dt / 1000) * car.speedMps;

      // wrap route
      if (car.traveled >= car.routeDistance) {
        // Машина доехала до конца маршрута → начинаем fade-out
        if (car.status !== "fade-out") {
          car.status = "fade-out";
          car.fadeOutStart = now;
        }

        // Фиксируем в конце маршрута
        car.traveled = car.routeDistance;
      }

      const pos = interpolateOnRoute(car.route, car.traveled);
      const heading = computeHeadingOnRoute(car.route, car.traveled);

      car.marker.setPosition(pos);
      car.marker.setIcon(makeCarIcon(46, heading));

      //
      // === 2. FADE-IN (происходит во время движения)
      //
      if (car.status === "fade-in") {
        const t = Math.min(1, age / fadeInMs);
        car.marker.setOpacity(t);

        if (t >= 1) {
          car.status = "running";
        }
      }

      //
      // === 3. RUNNING (только проверяем истечение жизни)
      //
      if (car.status === "running") {
        if (age >= car.lifeTime) {
          car.status = "fade-out";
          car.fadeOutStart = now;
        }
      }

      //
      // === 4. FADE-OUT (происходит во время движения)
      //
      if (car.status === "fade-out") {
        const dtFade = now - (car.fadeOutStart ?? now);
        const t = Math.min(1, dtFade / fadeOutMs);
        car.marker.setOpacity(1 - t);

        if (t >= 1) {
          car.marker.setMap(null);
          toRemove.push(car);
        }
      }
    }

    if (toRemove.length) {
      carsRef.current = carsRef.current.filter(c => !toRemove.includes(c));
    }

    animationRef.current = requestAnimationFrame(animateFrame);
  }

  //
  // ------- EFFECT -------
  //

  useEffect(() => {
    if (!origin || !map || !isActive) return;

    spawnTimerRef.current = setInterval(spawnCar, spawnIntervalMs);
    animationRef.current = requestAnimationFrame(animateFrame);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      carsRef.current.forEach((c) => c.marker.setMap(null));
      carsRef.current = [];
    };
  }, [isActive, origin, map]);

  useEffect(() => {
    if (!map || !origin || !isActive) return;

    async function fetchRoutes() {
      realRoutesRef.current = await loadRealRoutes(origin!, routeRadiusMeters);
    }

    fetchRoutes();
  }, [map, origin, isActive]);
}
