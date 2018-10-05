import templateHTML from "../templates/grid.html"
import Mustache from "mustache"
import config from './../../config.json'
import axios from 'axios'

export default function placeGrids () {
    axios.get(config.docDataUrl).then(function(response){
        var grids = response.data.grids;
        console.log(grids);
        grids.forEach(grid => {
            try {
                document.querySelector(grid.slot).innerHTML = Mustache.render(templateHTML, grid);
            } catch (err) {
                console.log(grid.slot + " not found");
            }
        });
    })
}