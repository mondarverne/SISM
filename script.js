// Création de la constance map
/*const map = new maplibregl.Map({
    container: "map",
    style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
            osm: {
                type: "raster",
                tiles: [
                    "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
                maxzoom: 19
            }
        },
        layers: [
            {
                id: "osm",
                type: "raster",
                source: "osm"
            }
        ]
    },
    center: [3.174880, 45.686700],
    zoom: 10
});*/

const map = new maplibregl.Map({
    container: "map",
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: [3.16095528, 45.66070116],
    zoom: 11
});


// Accès au données des secteurs permis de louer
const lien_data_animation =
  "https://raw.githubusercontent.com/mondarverne/SISM/main/DATA/data_animation.geojson";

const lien_data_communes =
  "https://raw.githubusercontent.com/mondarverne/SISM/main/DATA/data_communes.geojson";

const lien_data_epci = "https://raw.githubusercontent.com/mondarverne/SISM/main/DATA/data_epci.geojson";


// début de l'affichage des couches avec le map.on
map.on("load", function () {


  // Configuration légende
  map.getCanvas().style.cursor = 'default';
    map.getCanvas().style.cursor = 'default';
    var layers = ["A partir de 18 ans", "S'adresse aux jeunes (-18 ans)", 'Tout public' ];
    var colors = ['#e74c3c', '#3498db', '#2ecc71'];
    for (i=0; i<layers.length; i++) {
        var layer = layers[i] + "";
        var color = colors[i];
        var item = document.createElement('div');
        var key = document.createElement('span');
        key.className = 'legend-key';
        key.style.backgroundColor = color;
        var value = document.createElement('span');
        value.innerHTML = layer;
        item.appendChild(key);
        item.appendChild(value);
        legend.appendChild(item);
    }


  // Boutons de navigation
  var nav = new maplibregl.NavigationControl();
  map.addControl(nav, "bottom-right");
  
  //map.addControl(new maplibregl.FullscreenControl());



      // Ajout de la couche des communes
    map.addSource('communes', {
      type: 'geojson',
      data: lien_data_communes
    });

    map.addLayer({
        id: 'communes_layer',
        type: 'line',
        source: 'communes',
        paint: {
            'line-color': '#252525',
            'line-width': 0.4,
            'line-dasharray': [8, 8]
        }
    });


    // Ajout de la coche de MAC
    map.addSource('mac', {
      type: 'geojson',
      data: lien_data_epci
    });

    map.addLayer({
        id: 'mac_layer',
        type: 'line',
        source: 'mac',
        paint: {
            'line-color': '#252525',
            'line-width': 0.8,
        }
    });


    // Ajout parcelles concernés par le permis de louer depuis GitHub
    map.addSource('animation', {
      type: 'geojson',
      data: lien_data_animation,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 20 // Radius of each cluster when clustering points (defaults to 50)
    });

    
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'animation',
        filter: ['has', 'point_count'],
        paint: {
            // Use step expressions (https://maplibre.org/maplibre-style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#C06FA1',
                3,
                '#C06FA1'
            ],
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                13,
                3,
                20
            ],
            'circle-stroke-color' : '#ffffff',
            'circle-stroke-width' : 1

        }
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'animation',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count}',
            'text-font': ['Noto Sans Bold'],
            'text-size': 12
        },
        paint: {
          'text-color' : '#ffffff'
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'animation',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': [
              'match',
              ['get', 'Public'],

              'A partir de 18 ans', '#e74c3c',
              "S'adresse aux jeunes (-18 ans)", '#3498db',
              'Tout public', '#2ecc71',

              '#eaf0f1' // couleur par défaut
            ],
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });



fetch(lien_data_animation)
    .then((response) => response.json())
    .then((data) => {

        // Récupération de la liste
        const liste = document.getElementById("liste-activites");
        const bouton = document.getElementById("btn-activites");

        // Création de la liste des activités
        data.features.forEach((feature) => {

            const nom = feature.properties.titre_rech;

            const item = document.createElement("div");

            item.className = "activite";
            item.textContent = nom;

            // Clic sur une activité
            item.addEventListener("click", () => {

                const coordinates = feature.geometry.coordinates;

                // Zoom sur l'activité
                map.flyTo({
                    center: coordinates,
                    zoom: 16,
                    duration: 1500
                });

                // Fermer la liste
                liste.classList.remove("active");
            });

            liste.appendChild(item);
        });

        // Ouvrir / fermer la liste
        bouton.addEventListener("click", () => {
            liste.classList.toggle("active");
        });

    });


  
  // Ajout de l'échelle
  var scale = new maplibregl.ScaleControl({
    maxWidth: 100,
    unit: 'metric'
  });
  map.addControl(scale);

});


// Ajouter la possibilité de cliquer sur un cluster pour avoir un zoom
map.on('click', 'clusters', (e) => {

    const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
    });

    if (!features.length) return;

    map.easeTo({
        center: features[0].geometry.coordinates,
        zoom: 16 //niveau de zoom fixe
    });
});

// Afficher le curseur pour cliquer
map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
});


// Mise en place des popup 
map.on('click', 'unclustered-point', (e) => {

    const feature = e.features[0];

    const coordinates = feature.geometry.coordinates.slice();

    new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
            <h3>${feature.properties.titre}</h3>
            <popup_nom>${feature.properties.Nom}</popup_nom>
            <popup_lieu> <strong>${feature.properties.date_text} - ${feature.properties.Heure}</strong> - ${feature.properties.Public} - ${feature.properties.Lieu}</popup_lieu>
            <popup_descri> ${feature.properties.Description}</popup_descri>
            <popup_info> ${feature.properties.Infos}</popup_info>
        `)
        .addTo(map);
});