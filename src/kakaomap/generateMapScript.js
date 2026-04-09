const generateMapScript = (lat, lng, markerData, offsetY = 0, options = {}) => {
  const safeData = JSON.stringify(markerData ?? []);
  const {
    suppressUserMarker = false,
    allowUserMarker = true, // optional flag to explicitly control user marker rendering
  } = options || {};
  return `
  if (!window.map) {
    var mapContainer = document.getElementById('map');
    var options = {
      center: new kakao.maps.LatLng(${lat}, ${lng}),
      level: 5
    };
    window.map = new kakao.maps.Map(mapContainer, options);

    kakao.maps.event.addListener(window.map, 'idle', function () {
      const center = window.map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        action: 'mapMoved',
        latitude: parseFloat(center.getLat().toFixed(5)),
        longitude: parseFloat(center.getLng().toFixed(5))
      }));
    });

    kakao.maps.event.addListener(window.map, 'zoom_changed', function () {
      // Close any open multi-store list when the zoom level changes
      try {
        if (window.currentOverlay) {
          window.currentOverlay.setMap(null);
          window.currentOverlay = null;
        }
        window.isStoreListClicked = false;
      } catch (_e) {}
      try {
        var center = window.map.getCenter();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'mapZoomChanged',
          latitude: parseFloat(center.getLat().toFixed(5)),
          longitude: parseFloat(center.getLng().toFixed(5)),
          level: window.map.getLevel()
        }));
      } catch (_e) {}
    });
  }

 var map = window.map;

  // Name bubble helper overlay (for selected store)
  try {
  if (!window.__nameOverlayStyle) {
window.__nameOverlayStyle =
  "position: relative;" +
  "padding: 8px 14px;" +
  "border-radius: 14px;" +
  "font-size: 14px;" +
  "font-family: Pretendard, Arial, sans-serif;" +
  "font-weight: 600;" +
  "color: #ffffff;" +
  "background: #3CBBFF;" +
  "box-shadow: 0 3px 8px rgba(60,187,255,0.35);" +
  "white-space: nowrap;" +
  "pointer-events: auto;" +
  "cursor: pointer;" +
  "transform: translateY(-32px);" +
  "border: none;";
}
    // Restore previously hidden marker (if any) and remove bubble
    window.clearStoreLabel = function(){
      try {
        if (window.__storeNameOverlay) {
          window.__storeNameOverlay.setMap(null);
          window.__storeNameOverlay = null;
        }
      } catch(e){}
      try {
        if (window.__hiddenMarkerKey && window.__markerMap) {
          var mk = window.__markerMap[window.__hiddenMarkerKey];
          if (mk) { mk.setMap(map); }
        }
      } catch(e){}
      try {
        if (window.__hiddenMarkerKey && window.__overlayMap) {
          var ov = window.__overlayMap[window.__hiddenMarkerKey];
          if (ov) { ov.setMap(map); }
        }
      } catch(e){}
      try { window.__hiddenMarkerKey = null; } catch(e){}
    };
    // Show name bubble and hide the corresponding marker at that coordinate
    window.showStoreLabelAt = function(lat, lng, name, count){
  try {
    if (!map) return;
    var pos = new kakao.maps.LatLng(lat, lng);
    // manage marker hide/show
    try {
      var key = (Number(lat).toFixed(6))+","+(Number(lng).toFixed(6));
      // restore previously hidden marker/overlay if switching target
      if (window.__hiddenMarkerKey && window.__hiddenMarkerKey !== key) {
        try {
          if (window.__markerMap) {
            var prevM = window.__markerMap[window.__hiddenMarkerKey];
            if (prevM) { prevM.setMap(map); }
          }
        } catch(e){}
        try {
          if (window.__overlayMap) {
            var prevO = window.__overlayMap[window.__hiddenMarkerKey];
            if (prevO) { prevO.setMap(map); }
          }
        } catch(e){}
        window.__hiddenMarkerKey = null;
      }
      // hide current marker and its count overlay (if any)
      if (window.__markerMap && window.__markerMap[key]) {
        try { window.__markerMap[key].setMap(null); } catch(e){}
        window.__hiddenMarkerKey = key;
      }
      if (window.__overlayMap && window.__overlayMap[key]) {
        try { window.__overlayMap[key].setMap(null); } catch(e){}
      }
    } catch(e){}
    var el = document.createElement('div');
    el.style.cssText = window.__nameOverlayStyle;
    // bubble content with optional count badge at top-right
    var safeName = (name || '');
    var badgeHtml = '';
    // Only show badge for groups with more than 1 store
    try { if (typeof count === 'number' && count > 1) { badgeHtml = '<span style="position:absolute; top:-8px; right:-10px; background:#fff; color:#111;  border-radius:9px;  padding:1px 5px; display:flex; align-items:center; justify-content:center; font-size:10px; line-height:18px; border:1px solid #3CBBFF;">'+ count +'</span>'; } } catch(_e){}
    el.innerHTML = badgeHtml + safeName +
      '<div style="position:absolute; bottom:-5px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #3CBBFF;"></div>';
    // Bubble click -> reopen list overlay for this coordinate if group > 1
    try {
      el.addEventListener('click', function(event){
        try { event.stopPropagation && event.stopPropagation(); } catch(e){}
        try {
          var key = (Number(lat).toFixed(6))+","+(Number(lng).toFixed(6));
          var groups = window.__storeGroups || {};
          var grp = groups[key];
          if (grp && grp.length > 1) {
            if (window.currentOverlay) { try { window.currentOverlay.setMap(null); } catch(e){} }
            window.isStoreListClicked = true;
            var overlayContent = document.createElement('div');
            overlayContent.style.cssText = "background:white; padding:10px; border-radius:10px; box-shadow:0px 2px 5px rgba(0,0,0,0.2); font-size:14px; width:60vw; border:1px solid #ddd; position:relative; transform:translateY(-30px);";
            overlayContent.addEventListener('click', function(ev){ try{ ev.stopPropagation(); }catch(e){} });
            (grp || []).forEach(function(store, index){
              var storeItem = document.createElement('div');
              storeItem.innerHTML = '<div style="display:flex; align-items:center; padding:10px; cursor:pointer;"><div style="width:8px; height:8px; background:#5cceff; border-radius:50%; margin-right:8px;"></div>' + '<span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block;">' + (store.storeName || '') + '</span>' + '</div>';
              if (index !== (grp.length - 1)) { storeItem.style.borderBottom = '1px solid #eee'; }
              storeItem.onclick = function(ev2){
                try{ ev2.stopPropagation && ev2.stopPropagation(); }catch(e){}
                window.isStoreListClicked = true;
                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'markerListItemClicked', storeId: store.storeId, total: grp.length }));
                } catch(e){}
              };
              overlayContent.appendChild(storeItem);
            });
            var overlay = new kakao.maps.CustomOverlay({ content: overlayContent, position: pos, map: map, zIndex: 10, yAnchor: 1 });
            window.currentOverlay = overlay;
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'markerGroupClicked', storeId: grp[0].storeId, total: grp.length }));
            } catch(e){}
            // when switching from bubble to list, remove bubble but keep marker hidden
            try { if (window.__storeNameOverlay) { window.__storeNameOverlay.setMap(null); window.__storeNameOverlay = null; } } catch(e){}
          }
        } catch(e){}
        // For single store bubble, do nothing on click (do not clear)
      });
    } catch(e){}
    if (window.__storeNameOverlay) { 
      try { window.__storeNameOverlay.setMap(null);} catch(e){} 
    }
  window.__storeNameOverlay = new kakao.maps.CustomOverlay({
      position: pos,
      content: el,
      yAnchor: 0.5,
      zIndex: 20
    });
      window.__storeNameOverlay.setMap(map);
  } catch(e){}
};
  } catch(_e){}

   var markerImageUrl = "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(\`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 400 400">
  <!-- Outer translucent circle -->
  <circle cx="200" cy="200" r="200" fill="rgba(0, 109, 254, 0.2)" />

  <!-- Center white dot -->
  <circle cx="200" cy="200" r="90" fill="#ffffff" />
  <!-- Middle solid circle -->
  <circle cx="200" cy="200" r="60" fill="#006DFE" />

</svg>
 \`);

 var markerImage = new kakao.maps.MarkerImage(
    markerImageUrl,
    new kakao.maps.Size(40, 40),
    { offset: new kakao.maps.Point(20, 20) }
 );

  // Helper to move or create only the user marker without touching store markers
  window.moveUserMarker = function(lat, lng) {
    try {
      if (!map) return;
      var targetPos = new kakao.maps.LatLng(lat, lng);
      if (!window.currentMarker) {
        window.currentMarker = new kakao.maps.Marker({
          position: targetPos,
          map: map,
          title: '현재 위치',
          image: markerImage,
          zIndex: 2
        });
      } else {
        window.currentMarker.setPosition(targetPos);
        window.currentMarker.setMap(map);
      }
    } catch(e){}
  };

 var __skipUserMarker = ${suppressUserMarker ? 'true' : 'false'} || ${
    allowUserMarker ? 'false' : 'true'
  };
 if (!__skipUserMarker) {
      try {
        var __baseLatLng = new kakao.maps.LatLng(${lat}, ${lng});
        if (!window.currentMarker) {
          window.currentMarker = new kakao.maps.Marker({
            position: __baseLatLng,
            map: map,
            title: '현재 위치',
            image: markerImage,
            zIndex: 2
          });
        } else {
          window.currentMarker.setPosition(__baseLatLng);
          window.currentMarker.setMap(map);
        }
      } catch (e) {
        // fallback: place at exact center if projection failed
        if (!window.currentMarker) {
          window.currentMarker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(${lat}, ${lng}),
            map: map,
            title: '현재 위치',
            image: markerImage,
            zIndex: 2
          });
        } else {
          window.currentMarker.setPosition(new kakao.maps.LatLng(${lat}, ${lng}));
          window.currentMarker.setMap(map);
        }
      }
    }

  if (window.storeMarkers) {
    window.storeMarkers.forEach(marker => marker.setMap(null));
  }

if (window.overlayMarkers) {
  window.overlayMarkers.forEach(customOverlay => customOverlay.setMap(null));
}

  var storesArray = ${safeData};
  var storeGroups = null; // will be set per level strategy

  try {
    var level = map.getLevel();
    var gridSize = level >= 5 ? 50:level >= 4 ? 40  :level >= 3 ? 30  : 0;
    var proj = map.getProjection();
    var center = map.getCenter();
    var centerPt = proj.containerPointFromCoords(center);
    var rawStores = storesArray.slice();

    function coordKeyFromStore(s){
      try{
        var la = (s && s.locationDto && s.locationDto.latitude != null)
          ? s.locationDto.latitude
          : s.latitude;
        var lo = (s && s.locationDto && s.locationDto.longitude != null)
          ? s.locationDto.longitude
          : s.longitude;
        if(la==null || lo==null) return null;
        return Number(la).toFixed(6)+","+Number(lo).toFixed(6);
      }catch(_e){return null;}
    }

    function secondsFromHHMMSS(t){
      if(!t) return null;
      var p=t.split(':');
      if(p.length<2) return null;
      var h=parseInt(p[0],10)||0,m=parseInt(p[1],10)||0,s=parseInt(p[2]||'0',10)||0;
      return h*3600+m*60+s;
    }

    function isOpenNow(store){
      try{
        if(store.isAlwaysOpen) return true;
        var ops = store.operationInfoDtos || [];
        if(!ops.length) return false;
        var now = new Date();
        var dow = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][now.getDay()];
        var today = ops.find(function(o){return o.dayOfWeek===dow});
        if(!today) return false;
        if(today.isClosed) return false;
        var cur = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
        var openS = secondsFromHHMMSS(today.openTime);
        var closeS = secondsFromHHMMSS(today.closeTime);
        var bStart = secondsFromHHMMSS(today.breakStartTime);
        var bEnd = secondsFromHHMMSS(today.breakEndTime);
        if(openS!=null && closeS!=null){
          if(!(cur>=openS && cur<=closeS)) return false;
        }
        if(bStart!=null && bEnd!=null){
          if(cur>=bStart && cur<=bEnd) return false;
        }
        return true;
      }catch(e){return false;}
    }

    // decorate with priority fields
    var enriched = storesArray.map(function(s){
      var lat = s.locationDto && s.locationDto.latitude;
      var lng = s.locationDto && s.locationDto.longitude;
      var pt = (lat!=null && lng!=null) ? proj.containerPointFromCoords(new kakao.maps.LatLng(lat,lng)) : {x:0,y:0};
      var dx = pt.x - centerPt.x, dy = pt.y - centerPt.y;
      var dist2 = dx*dx + dy*dy;
      return {
        _src: s,
        isCertified: !!s.isCertified,
        isOpen: isOpenNow(s),
        dist2: dist2,
        postCount: s.postCount || 0,
        pt: pt
      };
    });

    enriched.sort(function(a,b){
      if(a.isCertified!==b.isCertified) return a.isCertified? -1: 1;
      if(a.isOpen!==b.isOpen) return a.isOpen? -1: 1;
      if(a.dist2!==b.dist2) return a.dist2 - b.dist2; // nearer first
      return (b.postCount)-(a.postCount);
    });

    // build coordinate groups (same lat/lng rounded to 6 decimals)
    var coordGroups = {};
    for (var c=0;c<rawStores.length;c++){
      var st = rawStores[c];
      var key = coordKeyFromStore(st);
      if(!key) continue;
      if(!coordGroups[key]) coordGroups[key] = [];
      coordGroups[key].push(st);
    }

    if(gridSize>0){
      // screen-space declutter: choose one representative per cell
      var occupied = {};
      var reps = [];
      for(var i=0;i<enriched.length;i++){
        var e = enriched[i];
        var gx = Math.floor(e.pt.x / gridSize);
        var gy = Math.floor(e.pt.y / gridSize);
        var k = gx+","+gy;
        if(!occupied[k]){ occupied[k]=1; reps.push(e._src); }
      }
      storesArray = reps;
      // overlays show only stores at the SAME COORD as the representative
      storeGroups = {};
      for (var r=0;r<reps.length;r++){
        var rep = reps[r];
        var ck = coordKeyFromStore(rep);
        if(!ck) continue;
        storeGroups[ck] = coordGroups[ck] || [rep];
      }
    } else {
      // no declutter: one marker per coordinate group
      storesArray = Object.keys(coordGroups).map(function(k){ return coordGroups[k][0]; });
      storeGroups = coordGroups;
    }
    
  } catch(_e) { /* fallback: keep original storesArray */ }
  if (!storeGroups) {
    // ultimate fallback to coordinate grouping
    storeGroups = {};
    storesArray.forEach(function(store){
      try{
        var la = store.locationDto && store.locationDto.latitude;
        var lo = store.locationDto && store.locationDto.longitude;
        var key = (la!=null && lo!=null) ? la.toFixed(6)+","+lo.toFixed(6) : null;
        if(!key) return;
        if(!storeGroups[key]) storeGroups[key] = [];
        storeGroups[key].push(store);
      }catch(_e){}
    });
  }
  // expose groups globally for later interactions (e.g., bubble click)
  try { window.__storeGroups = storeGroups; } catch(_e){}
window.overlayMarkers = [];
  window.storeMarkers = [];
  window.__markerMap = {};
  window.__overlayMap = {};
  window.__hiddenMarkerKey = null;
  window.currentOverlay = null;

  for (var addr in storeGroups) {
    var group = storeGroups[addr];
    var count = group.length;
var numberText =
  count > 1
    ? '<text x="16" y="13.5" font-size="10" font-weight="700" font-family="Pretendard, Arial" fill="#3CBBFF" text-anchor="middle" dominant-baseline="central">' 
        + count + 
      '</text>'
    : '';

var circleRadius = count > 1 ? 7 : 6;

var customMarkerSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="36" viewBox="0 0 32 36">' +
    '<path d="M16 1 C9 1 4 6 4 12 C4 17 8 22 11 25 L16 30 L21 25 C24 22 28 17 28 12 C28 6 23 1 16 1 Z" fill="#3CBBFF"/>' +
    '<circle cx="16" cy="13" r="' + circleRadius + '" fill="white"/>' +
    numberText +
  '</svg>';

var customMarkerUri =
  "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(customMarkerSvg);
    var __groupLat = (group[0].locationDto && group[0].locationDto.latitude != null)
      ? group[0].locationDto.latitude
      : group[0].latitude;
    var __groupLng = (group[0].locationDto && group[0].locationDto.longitude != null)
      ? group[0].locationDto.longitude
      : group[0].longitude;
    if(__groupLat==null || __groupLng==null){
      continue;
    }
    var markerPosition = new kakao.maps.LatLng(__groupLat, __groupLng);
    
    var marker = new kakao.maps.Marker({
      position: markerPosition,
      map: map,
      title: group[0].storeName,
      zIndex: 1,
      image: new kakao.maps.MarkerImage(
        customMarkerUri,
    new kakao.maps.Size(34, 36),
    { offset: new kakao.maps.Point(17, 36) }
      )
    });

    // keep a mapping from coordinate key to marker for hide/show management
    try {
      var __latKey = (__groupLat!=null) ? Number(__groupLat).toFixed(6) : null;
      var __lngKey = (__groupLng!=null) ? Number(__groupLng).toFixed(6) : null;
      if(__latKey!=null && __lngKey!=null){
        var __k = __latKey+","+__lngKey;
        window.__markerMap[__k] = marker;
      }
    } catch(e){}

    // ✅ 가게 리스트 오버레이 생성
    function createStoreListOverlay(group, markerPosition) {
     window.isStoreListClicked = true;
      try { if (window.clearStoreLabel) { window.clearStoreLabel(); } } catch(e){}
      if (window.currentOverlay) {
        window.currentOverlay.setMap(null);
      }

      var overlayContent = document.createElement('div');
      overlayContent.style.cssText = "background:white; padding:10px; border-radius:10px; box-shadow:0px 2px 5px rgba(0,0,0,0.2); font-size:14px; width:60vw; border:1px solid #ddd; position:relative; transform:translateY(-30px);";
      
      // ✅ 리스트 내부 클릭 시 닫히지 않도록 방지
      overlayContent.addEventListener("click", function(event) {
        event.stopPropagation();
        // ✅ 리스트 내부 클릭 감지
      });

      group.forEach((store, index) => {
        var storeItem = document.createElement('div');
        storeItem.innerHTML = '<div style="display:flex; align-items:center; padding:10px; cursor:pointer;"><div style="width:8px; height:8px; background:#5cceff; border-radius:50%; margin-right:8px;"></div>' +'<span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block;">' +store.storeName +'</span>' + '</div>';

        // ✅ 마지막 아이템의 아래 테두리는 없애기
        if (index !== group.length - 1) {
          storeItem.style.borderBottom = "1px solid #eee";
        }

        storeItem.onclick = function(event) {
          event.stopPropagation(); // ✅ 지도 클릭 이벤트 방지
          window.isStoreListClicked = true; // ✅ 리스트 내부 클릭 감지

          // ✅ storeId React Native로 전달
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            action: 'markerListItemClicked', 
            storeId: store.storeId,
            total: (group && group.length) ? group.length : 1
          }));
        };

        overlayContent.appendChild(storeItem);
      });

      var overlay = new kakao.maps.CustomOverlay({
        content: overlayContent,
        position: markerPosition,
        map: map,
        zIndex:10,
        yAnchor: 1 // ✅ 마커 위쪽에 배치
      });

      window.currentOverlay = overlay;
    }

    // ✅ 마커 클릭 시 오버레이 표시 (새로운 리스트 클릭하면 기존 리스트 닫힘)
    (function(group, markerPosition) {
      kakao.maps.event.addListener(marker, 'click', function() {
        try { if (window.clearStoreLabel) { window.clearStoreLabel(); } } catch(e){}
        if (window.currentOverlay) {
          window.currentOverlay.setMap(null);
          window.currentOverlay = null;
        }

        if (group.length > 1) {
          createStoreListOverlay(group, markerPosition);
          try {
            var ids = group.map(function(s){ return s.id; });
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: 'markerGroupClicked',
              storeId: group[0].storeId,
              total: group.length
            }));
          } catch (e) {}
        } else if (group.length === 1) {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              action: 'markerClicked',
              storeId: group[0].storeId
            }));
          } catch (e) {}
        }
      });
    })(group, markerPosition);

    // 🔹 마커 개수 표시 (그룹이 2개 이상일 경우)
    // if (group.length > 1) {
    //   var overlayElement = document.createElement('div');
    //   overlayElement.style.cssText = "pointer-events:none; position:relative; transform:translate(12px, -4px); background:#5cceff; color:white; width:14px; height:14px; border-radius:50%; border:0.5px solid #ffffff; display:flex; align-items:center; justify-content:center; font-size:10px; font-family:Arial,sans-serif; font-weight:bold;";
    //   overlayElement.innerText = group.length;
      
    //   var customOverlay = new kakao.maps.CustomOverlay({
    //     position: markerPosition,
    //     content: overlayElement,
    //     map: map,
    //     zIndex: 3
    //   });
    //   window.overlayMarkers.push(customOverlay);
    //   try {
    //     var __ovk = (group[0].locationDto.latitude.toFixed(6))+","+(group[0].locationDto.longitude.toFixed(6));
    //     window.__overlayMap[__ovk] = customOverlay;
    //   } catch(e){}
    // }
    
    window.storeMarkers.push(marker);
  }

  // ✅ 지도 클릭 시, 오버레이를 닫는 로직 (리스트 내부 클릭 제외!!)
  if (!window.lastMapClick) {
    window.lastMapClick = 0;
    kakao.maps.event.addListener(map, 'click', function(event) {
      var now = Date.now();
      if (now - window.lastMapClick > 300) { 
        window.lastMapClick = now;

        // ✅ 리스트 내부 클릭이면 닫지 않음
        if (window.isStoreListClicked) {
          window.isStoreListClicked = false; // ✅ 플래그 초기화
          return;
        }

        if (window.currentOverlay) {
          window.currentOverlay.setMap(null);
          window.currentOverlay = null;
        }
      }
    });
  }

  true;
`;
};
export default generateMapScript;
