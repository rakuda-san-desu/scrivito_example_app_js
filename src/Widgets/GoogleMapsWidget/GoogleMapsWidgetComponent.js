import * as React from "react";
import * as Scrivito from "scrivito";

import googleMapsApiKey from "../../utils/googleMapsApiKey";
import googleMapsImageUrl from "../../utils/googleMapsImageUrl";
import "./GoogleMapsWidget.scss";

const maxWidth = 640;

function GoogleMapsWidgetComponent({ widget }) {
  const address = widget.get("address") || "Brandenburg Gate, Berlin, Germany";
  const zoom = widget.get("zoom") || "15";
  const apiKey = googleMapsApiKey();
  const mapType = widget.get("mapType") || "static";

  const Map = mapType === "static" ? StaticGoogleMap : InteractiveGoogleMap;

  return (
    <Map address={address} zoom={zoom} apiKey={apiKey}>
      <Widgets widget={widget} mapType={mapType} />
    </Map>
  );
}

function InteractiveGoogleMap({ address, apiKey, zoom, children }) {
  const url = `https://www.google.com/maps/embed/v1/place?q=${address}&key=${apiKey}&zoom=${zoom}`;
  return (
    <div className="google-maps-widget">
      <iframe
        title="Interactive Map"
        frameBorder="0"
        style={{ border: 0 }}
        src={url}
        loading="lazy"
      />
      {children}
    </div>
  );
}

function StaticGoogleMap({ address, apiKey, zoom, children }) {
  const [mapSize, setMapSize] = React.useState({
    elementHeight: 0,
    elementWidth: 0,
    height: null,
    width: null,
  });

  const ref = React.useRef(null);

  React.useEffect(() => {
    function handleResize() {
      const currentRef = ref.current;

      if (currentRef) {
        const elementWidth = currentRef.offsetWidth;
        const elementHeight = currentRef.offsetHeight;

        if (
          mapSize.elementWidth !== elementWidth ||
          mapSize.elementHeight !== elementHeight
        ) {
          let width = elementWidth;
          let height = elementHeight;

          if (width > maxWidth) {
            width = maxWidth;

            const factor = elementHeight / elementWidth;
            height = Math.round(maxWidth * factor);
          }

          setMapSize({
            elementHeight,
            elementWidth,
            height,
            width,
          });
        }
      }
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [mapSize]);

  return (
    <div
      ref={ref}
      className="google-maps-widget"
      style={{
        background: "no-repeat center / cover",
        backgroundImage: `url(${getMapUrl({
          width: mapSize.width,
          height: mapSize.height,
          address,
          apiKey,
          zoom,
        })})`,
      }}
    >
      {children}
    </div>
  );
}

function getMapUrl({ width, height, address, apiKey, zoom }) {
  if (!height || !width) {
    // wait for the real height/width to not consume too much rate from google.
    return "";
  }

  // See all options at https://developers.google.com/maps/documentation/static-maps/intro
  const params = {
    size: `${width}x${height}`,
    scale: 2, // with scale 2 google maps allows more pixels.
    markers: `color:red|${address}`,
    zoom,
    ie: "UTF8",
  };

  if (apiKey) {
    params.key = apiKey;
  }

  return googleMapsImageUrl(params);
}

const Widgets = Scrivito.connect(({ widget, mapType }) => {
  if (widget.get("showWidgets") !== "yes") {
    return null;
  }

  const containerClasses = ["container", "container-initial"];
  if (mapType === "interactive") {
    containerClasses.push("d-flex", "flex-row-reverse");
  }

  return (
    <div className={containerClasses.join(" ")}>
      <div className="col-lg-3 col-md-4 col-sm-5 container-initial">
        <Scrivito.ContentTag
          content={widget}
          attribute="content"
          className={"card card-theme"}
        />
      </div>
    </div>
  );
});

Scrivito.provideComponent("GoogleMapsWidget", GoogleMapsWidgetComponent);
