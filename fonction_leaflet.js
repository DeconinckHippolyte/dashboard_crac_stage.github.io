////////////////////////////////////////////////////////////////////////////////////////////////////
// Initalisation des fonction lealfet sur la carte : recherche d'adresse et centrage de la carte //
//////////////////////////////////////////////////////////////////////////////////////////////////



function initializeFonctionLeaflet(map) {

    //// Controle pour chercher une adresse
        const provider = new GeoSearch.OpenStreetMapProvider();

        const searchControl = new GeoSearch.GeoSearchControl({
            provider: provider,
            showMarker: true,
            showPopup: false,
            marker: {
                icon: new L.Icon.Default(),
                draggable: false,
            },
        });

        map.addControl(searchControl);


    

    //// controle pour revenir à la position d'origine
        var resetButton = L.Control.extend({
            options: {
                position: 'topleft'
            },
        
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        
                container.style.backgroundColor = 'white';
                container.style.backgroundImage = 'url("..icon_centrage.png")';
                container.style.backgroundSize = '20px 20px';
                container.style.backgroundRepeat = 'no-repeat';
                container.style.backgroundPosition = 'center';
                container.style.width = '30px';
                container.style.height = '30px';
        
                container.onclick = function(){
                    map.setView([46.8, 2.345818], 6);
                };

                // quand la souris passe sur le bouton, changer la couleur de fond en gris
                container.onmouseover = function(){
                    this.style.backgroundColor = '#dedede';
                };

                // quand la souris quitte le bouton, remettre la couleur de fond en blanc
                container.onmouseout = function(){
                    this.style.backgroundColor = 'white';
                };
            
                return container;
                }
        });
        map.addControl(new resetButton());


    /// conrole pour avoir une vue monde
        var worldButton = L.Control.extend({
            options: {
                position: 'topleft'
            },
        
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        
                container.style.backgroundColor = 'white';
                container.style.backgroundImage = 'url("../icon_decentrage.png")';
                container.style.backgroundSize = '20px 20px';
                container.style.backgroundRepeat = 'no-repeat';
                container.style.backgroundPosition = 'center';
                container.style.width = '30px';
                container.style.height = '30px';
        
                container.onclick = function(){
                    map.setView([32, 6], 1.5);
                };

                // quand la souris passe sur le bouton, changer la couleur de fond en gris
                container.onmouseover = function(){
                    this.style.backgroundColor = '#dedede';
                };

                // quand la souris quitte le bouton, remettre la couleur de fond en blanc
                container.onmouseout = function(){
                    this.style.backgroundColor = 'white';
                };

        
                return container;
            }
        });
        map.addControl(new worldButton());

}