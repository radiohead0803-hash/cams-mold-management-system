import { useEffect, useRef } from 'react';

const NAVER_SCRIPT_ID = 'naver-map-sdk';

export default function NaverMoldLocationMap({ locations, selectedMoldId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const infoWindowsRef = useRef({});

  // 상태별 마커 아이콘 생성
  const getMarkerIcon = (status, selected) => {
    if (!window.naver) return null;

    const color =
      status === 'ng'
        ? '#ef4444'
        : status === 'moved'
        ? '#f97316'
        : '#22c55e';

    const size = selected ? 24 : 18;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="${selected ? 9 : 7}" fill="${color}" />
        <circle cx="12" cy="12" r="${selected ? 4 : 3}" fill="white" />
      </svg>
    `;

    const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encoded}`,
      size: new window.naver.maps.Size(size, size),
      origin: new window.naver.maps.Point(0, 0),
      anchor: new window.naver.maps.Point(size / 2, size / 2)
    };
  };

  //  로   초기화
  useEffect(() => {
    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;

    if (!clientId || clientId === 'your_naver_client_id_here') {
      console.error('[NaverMap] VITE_NAVER_MAP_CLIENT_ID가 없습니다.');
      return;
    }

    const initMap = () => {
      if (!window.naver || !window.naver.maps || !mapRef.current) {
        console.error('[NaverMap] naver.maps가 없습니다.');
        return;
      }

      // 지도 (     )
        const center =
          locations.length > 0
            ? new window.naver.maps.LatLng(locations[0].lat, locations[0].lng)
            : new window.naver.maps.LatLng(37.5665, 126.978);

        nstaceRef.urrent = new window.navr.maps.Map(mapent, {
          cer,
          zoom: 10
        
      
      onst map  mapInstanceRef.current;

        도 
      ec.vaes(mrersR.current).orac() => .seMap(null));
      arersefcrrent  };
      ifoindowsRef.current = ;

      // 새마커생성
location.forEach((loc) => {
        if (!loc.lat || !loc.lng) rturn;

        const pos = nw winow.naver.maps.LatLng(loc.lat, loc.lng);
        const selected = loc. === electeol;

     const marker = new window.naver.maps.Marker({
          position: pos,
          map,
          icon: contt 
        
        con color
          t 
             e4
             oaus  oed
             3
            : 22;

        const contentHtml = `
        <div style="padding:px px;font-se;">
          <div style="font-weight:600;margin-bottom:px;">${loc.moldCode}</div>
          <div>${loc.plantNae}</div>
            <div style="magin-to:2px;color:${color};">
              상 ${loc.satstoperase()}
            </div>
          </div>
        `;

        const infoWindow = new window.naver.maps.InfoWindow({
          content: contentHtml
        });

        window.naver.maps.Event.addListener(marker, 'mouseover', () =>
          infoWindow.open(map, marker)
        );
        window.naver.maps.Event.addListenermarker,'mouseout',()=>
infoWindow.close()
   );

        aers.ent.dmarker
        seelcdodo;
      });
    };

    consegrp oct.lent);

    if (tingcrt) {
      onst sc = doe.atn();
      ci. = 
      ct.n 
      st o.naver.maps.ncltcln;

      scritonoad  )  
        consolloaera cit lae
     inita)
  };

      sitonerror e>{
        csoerorera le t ad scrit 
      
      cmenteildr
     lse 
       o.nave  idoners 
        t
       l{
        existigritaddvetstenrla t
      }
    

    ret   {
      cs scrit  dcmetetent
      i crt 
        ctreoeetstera intp
      
    
  } lassell])

  //         
  sefet>
    i seteoldd  asaceefcent  wnde retrn

    cstmer  merefurenseetd
    cs ini = ondefurenseetddd

    i  {
      st   asaeerre
      css =martsitn

      asetenters
      masetoom
                do.pname
             selectedMold  etrn (
    < className="- -00 roundedoddrste >
      <div ={e} className="- h-" />
    </div>
  );
}
