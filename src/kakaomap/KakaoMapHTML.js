const KakaoMapHTML = appKey => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      />
      <title>Kakao Map</title>
      <style>
        html,
        body,
        #map {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #ffffff;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        (function () {
          function sendMessage(payload) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(payload));
            }
          }

          var script = document.createElement('script');
          script.src =
            'https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false';

          script.onload = function () {
            if (!window.kakao || !window.kakao.maps) {
              sendMessage({ action: 'mapError', message: 'Kakao SDK unavailable' });
              return;
            }

            window.kakao.maps.load(function () {
              sendMessage({ action: 'mapReady' });
            });
          };

          script.onerror = function () {
            sendMessage({ action: 'mapError', message: 'Kakao SDK load failed' });
          };

          document.head.appendChild(script);
        })();
      </script>
    </body>
  </html>
`;

export default KakaoMapHTML;
