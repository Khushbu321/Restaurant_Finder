var map, infoWindow;

const ZOMATO_API_KEY = 'c6cddc2bb4ff45512c7ed8736710fb99';

document.querySelector('.close-btn').addEventListener('click', function(event) {
  event.target.parentElement.classList.remove('open');
});

function getZomatoUrl({lat, lng}) {
  return `https://developers.zomato.com/api/v2.1/geocode?lat=${lat}&lon=${lng}`
}

function fetchZomatoData(position) {
  const zomatoHeaders = {
    'user-key': ZOMATO_API_KEY,
  };
  return fetch(getZomatoUrl(position), { headers: zomatoHeaders });
}

function getZomatoCard(options) {
  return (
    `<div>
    <div class="resto-pics"><img height="300" class="inset-image" src="${options.featured_image}"><span class="resto-name">${options.name}</span></div>
    <div class="resto-cuisines">${options.cuisines}</div>
    <div class="resto-rating">Average user rating: ${options.user_rating.rating_text} (${options.user_rating.aggregate_rating})</div>
    <div class="resto-meta">Cost for two: &#8377; ${options.average_cost_for_two}, ${options.has_online_delivery === 1 ? 'delivery available' : 'delivery unavailable'}, ${options.has_table_booking === 1 ? 'accepts table booking' : 'table booking unavailable'} </div>
    <div class="resto-links"><a class="link mjR" target="_blank" href="${options.menu_url}">Access Menu</a></div>
    </div>`
    )
}

function markerListener(restaurant) {
  const infoBox = document.querySelector('#restaurant-info');
  infoBox.classList.add('open');
  const html = getZomatoCard(restaurant);
  document.querySelector('.restaurant-content').innerHTML = html;
}

function saveZomatoData(json) {
  if(json && json.nearby_restaurants) {
    json.nearby_restaurants.forEach(({ restaurant }) => {
      const title = restaurant.name;
      const pos  = { lat: parseFloat(restaurant.location.latitude), lng: parseFloat(restaurant.location.longitude) };
      const marker = new google.maps.Marker({
        map: window.map,
        position: pos,
        title,
      });
      marker.addListener('click', markerListener.bind(null, restaurant));
    });
  }
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 12.9715987, lng: 77.59456269999998},
    zoom: 15
  });
  infoWindow = new google.maps.InfoWindow;

  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  searchBox.addListener('places_changed', function(event) {
    const places = searchBox.getPlaces();
    if (places && places.length) {
      const place = places[0];
      const pos = {
        lat: parseFloat(place.geometry.location.lat()),
        lng: parseFloat(place.geometry.location.lng()),
      };

      const fetchPromise = fetchZomatoData(pos);

      fetchPromise
      .then(res => res.json())
      .then(json => saveZomatoData(json));
      infoWindow.open(map);
      map.setCenter(pos);
    }
  });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        const fetchPromise = fetchZomatoData(pos);
        fetchPromise
        .then(res => res.json())
        .then(json => saveZomatoData(json));
        infoWindow.open(map);
        map.setCenter(pos);
      });
    }
  }
