import * as d3B from 'd3'
import * as d3Select from 'd3-selection'
import * as d3geo from 'd3-geo'
import * as topojson from 'topojson'

let d3 = Object.assign({}, d3B, d3geo);

const isMobile = window.matchMedia('(max-width: 600px)').matches

const topBar = {
    "el": document.querySelector(".interactive-top-bar")
};

const appEl = document.querySelector(".interactive-wrapper");

const barHeight = document.querySelector(".interactive-top-bar").clientHeight;

let selectedDate;

let events = [];

let padding = {top:0,right:5,bottom:0,left:80};

let tLineYpos = 0;

let locatorWidth = 200;
let locatorHeight = 200;

let flagPpoint = 0;

Promise.all([
    d3.json("https://interactive.guim.co.uk/docsdata-test/13Rw2TmPSOvE8Q_PfXRQglPo5ic2_YmqmCTQtMGJCYx4.json"),
    d3.json("../assets/world-simple.json")
    ])
.then(ready)



function ready(arr)
{

    let data = arr[0]
    let world = arr[1]

    d3.map(data.sheets.Sheet1, function(row){
       let eventTime = new Date();
       eventTime.setHours(row['start time'].split(':')[0])
       eventTime.setMinutes(row['start time'].split(':')[1])
       eventTime.setSeconds(0);

       selectedDate = new Date();

       events.push({location: row.location, eventTime:eventTime, deaths:+row.deaths, injured:+row.injured, lat:row.lat, lon:row.lon, description:row.description})
    })

    makeGrid();

    makeKeyPoints();

    makeLocator(world)
    
    window.requestAnimationFrame(step);

}

function makeGrid()
{
    let tline = d3.select('.tline')

    if(isMobile)
    {
        d3.select('.tline').attr('class', 'column tline mobile');
        d3.select('.description').attr('class', 'description mobile');

        for (var i = 0; i < 24 ; i++) {
            makeTimeLine(tline, i)
        }
    }
    else
    {
        for (var i = 0; i < 24; i++) {
            makeTimeLine(tline, i)
        }
    }
}


function makeKeyPoints()
{
    let point;

    d3.map(events, function(event){

        if(event.eventTime != 'Invalid Date'){

            let hours = event.eventTime.getHours();
            let minutes = event.eventTime.getMinutes();
            if(minutes === 0)minutes = '00';

            let g = d3.select(".hour.d" + hours + " svg g");

            let minuteHeight = g.node().getBoundingClientRect().height / 60;

            
            if(point != hours + "-" + minutes)
            {
                    point = hours + "-" + minutes;

                    if(minutes == '00')
                    {
                        let circle = d3.select(".hour.d" + hours + " svg g circle");
                        circle.attr('class', 'time-spot selected t' + hours + "-" + minutes)

                        let label = d3.select(".hour.d" + hours + " svg g text");
                        label.attr('class', 'time-label selected')
                        
                    }
                    else
                    {
                        g.append('circle')
                        .attr('cx', padding.left)
                        .attr('cy', minuteHeight * minutes)
                        .attr('r', 3)
                        .attr('class', 'time-spot selected t' + hours + "-" + minutes);

                        g.append('text')
                        .attr('class', 'time-label selected')
                        .attr("x", 15)
                        .attr("y", minuteHeight * minutes + 5)
                        .text(hours + ":" + minutes);

                    }
            } 
        }
    })
}



function makeLocator(world)
{
    let geojson = topojson.feature(world, world.objects.ne_10m_admin_0_map_subunits);
    let afghanistan = geojson.features.find((country) => d3.geoContains(country, [66.600337,34.237265]));
    let mapProjetion = d3.geoMercator().fitSize([locatorWidth, locatorHeight], afghanistan);
    let mapPath = d3.geoPath().projection(mapProjetion);

    d3.select(".locator-map")
    .append("path")
    .datum(afghanistan)
    .attr("d", mapPath)
    .attr('fill', '#F6F6F6');

}


function step()
{
	let boundingClient = appEl.getBoundingClientRect();

    if(boundingClient.top <= 0)
    {
    	topBar.el.classList.add("fixed");
    }

    if(boundingClient.bottom <= barHeight || boundingClient.top > 0)
    {
    	topBar.el.classList.remove("fixed");
    }

    if(boundingClient.bottom <= barHeight) { 
        topBar.el.classList.add("bottom");
    } else {
        topBar.el.classList.remove("bottom");
    }

    if(!isMobile)
    {
        flagPpoint = window.innerHeight / 3;
    }
    else
    {
        flagPpoint = 200;
    }

    let circles = d3.selectAll('.time-spot').nodes();
    let visible = circles.filter( c => Math.floor(c.getBoundingClientRect().top) <= flagPpoint)
    let topCircle = visible.slice(-1)[0];

    let totalDeaths = 0;
    let totalInjured = 0;
    
    let description = d3.select('.description').node();
    let deathsText = d3.select('.deaths span');
    let injuredText = d3.select('.injured span');
    let tline = d3.select('.tline').node();
    let yPos = tline.getBoundingClientRect().top;


    if(topCircle == circles[0])
    {
        deathsText.html('Death toll: 0')
        injuredText.html('Injured: 0')
    }
  

    if(topCircle)
    {
        let currentCircle = topCircle.getAttribute('class');

        d3.selectAll('.time-spot')
        .attr('r', 3)

        topCircle.setAttribute('r', 7);

        if(currentCircle.indexOf('selected') != -1){

            tLineYpos = tline.getBoundingClientRect().top;

            if(tLineYpos < 0){
                tLineYpos =  Math.abs(tLineYpos, yPos);
            }
            else{
                tLineYpos = tLineYpos - (tLineYpos * 2);
            }

            let marginTop = tLineYpos + topCircle.getBoundingClientRect().top - description.getBoundingClientRect().height / 2;


            if(!isMobile)
            {
                description.setAttribute('class', 'description selected');
                description.setAttribute('style', 'top:' + marginTop +'px');
            }
            else
            {
                description.setAttribute('class', 'description mobile selected');
            }

            let headline = d3.select('.description h3').node();
            let text = d3.select('.description p');
            
            let selectedEventHours = currentCircle.split(" ")[2].split('t')[1].split('-')[0];
            let selectedEventMinutes = currentCircle.split(" ")[2].split('t')[1].split('-')[1];

            selectedDate.setHours(selectedEventHours)
            selectedDate.setMinutes(selectedEventMinutes)
            selectedDate.setSeconds(0)

            let selectedEvent = events.find(e => e.eventTime.getHours() == selectedEventHours && e.eventTime.getMinutes() == selectedEventMinutes);

            let pastEvents = events.filter(e => e.eventTime.getTime() <= selectedDate.getTime());

            d3.map(pastEvents, function(p){totalDeaths += p.deaths});
            d3.map(pastEvents, function(p){totalInjured += p.injured});

            deathsText.html("Death toll: " + totalDeaths)
            injuredText.html("Injured: " + totalInjured)

            headline.textContent = selectedEvent.location
            text.html(selectedEvent.description);
               
        }
        else
        {
            if(!isMobile)
            {
                description.setAttribute('class', 'description');
            }
            else
            {
                description.setAttribute('class', 'description mobile');
            }
        }
    }

	window.requestAnimationFrame(step);
}


function makeTimeLine(tline, index)
{
    let divLine = tline.append('div')
    .attr('class', 'hour d' + index);

    let hourWidth = divLine.node().getBoundingClientRect().width;
    let hourHeight = divLine.node().getBoundingClientRect().height;

    let svg = divLine.append('svg')
    .attr("width", hourWidth + 'px')
    .attr("height", hourHeight + 'px');

    let svgWidth = svg.node().width.animVal.value - padding;

    let g = svg.append('g')

    let line = g.append('line')
    .attr('x1', padding.left)
    .attr('y1', 0)
    .attr('x2', padding.left)
    .attr('y2', hourHeight)
    .attr('class', 'line')

    let circle = g.append('circle')
    .attr('cx', padding.left)
    .attr('cy', padding.top)
    .attr('r', 5)
    .attr('class', 'time-spot t' + index + "-00")

    let timeLabel = g.append('text')
    .attr('class', 'time-label')
    .attr("x", 15)
    .attr("y", 5)
    .text(index + ":00")
}



