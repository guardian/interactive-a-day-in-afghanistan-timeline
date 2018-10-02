import * as d3B from 'd3'
import * as d3Select from 'd3-selection'
import * as d3geo from 'd3-geo'
import * as topojson from 'topojson'
import textures from 'textures'

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
let locatorHeight = 150;

let flagPpoint = 0;

let currentPrintedCircle;

let mapProjetion = d3.geoMercator()

let worldUrl = "<%= path %>/assets/world-simple.json";

Promise.all([
    d3.json("https://interactive.guim.co.uk/docsdata-test/13Rw2TmPSOvE8Q_PfXRQglPo5ic2_YmqmCTQtMGJCYx4.json"),
    d3.json(worldUrl)
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
    mapProjetion.fitSize([locatorWidth, locatorHeight], afghanistan);
    let mapPath = d3.geoPath().projection(mapProjetion);

    let texture = textures
      .lines()
      .size(6)
      .strokeWidth(1)
      .stroke('#DADADA');


    let locator = d3.select(".locator-map");

    locator.call(texture);

    
    locator
    .append("path")
    .datum(afghanistan)
    .attr("d", mapPath)
    .attr('fill', texture.url())
    .attr('stroke', '#333333')
    .attr('stroke-width', 0.5);
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
        flagPpoint = window.innerHeight / 2;
    }
    else
    {
        flagPpoint = 200;
    }

    let circles = d3.selectAll('.time-spot').nodes();
    let visible = circles.filter( c => Math.floor(c.getBoundingClientRect().top) <= flagPpoint)
    let topCircle = visible.slice(-1)[0];
    let lastCircle = circles[circles.length-1];
    
    let description = d3.select('.description').node();
    let tline = d3.select('.tline').node();
    let yPos = tline.getBoundingClientRect().top;

    if(topCircle)
    {
        let currentCircle = topCircle.getAttribute('class');

        d3.selectAll('.time-spot')
        .attr('r', 3)

        topCircle.setAttribute('r', 10);

        if(currentCircle.indexOf('selected') != -1 && lastCircle.getBoundingClientRect().top > barHeight){


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

            printDescription(currentCircle);
               
        }
        else
        {
            if(topCircle == circles[0])
            {
                printDescription(0, null);
            }

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


function printDescription(currentCircle)
{
    if(currentCircle)
    {
        if(currentPrintedCircle != currentCircle)
        {
            let selectedEventHours = currentCircle.split(" ")[2].split('t')[1].split('-')[0];
            let selectedEventMinutes = currentCircle.split(" ")[2].split('t')[1].split('-')[1];

            selectedDate.setHours(selectedEventHours)
            selectedDate.setMinutes(selectedEventMinutes)
            selectedDate.setSeconds(0)

            let selectedEvent = events.find(e => e.eventTime.getHours() == selectedEventHours && e.eventTime.getMinutes() == selectedEventMinutes);
            let pastEvents = events.filter(e => e.eventTime.getTime() <= selectedDate.getTime());

            let headline = d3.select('.description h3');
            let text = d3.select('.description p');
            let deaths = d3.select('.deaths');
            let injured = d3.select('.injured');
            let currentDeaths = d3.select('.current-deaths');
            let currentInjured = d3.select('.current-injured');
            let totalDeaths=0;
            let totalInjured=0;

            d3.map(pastEvents, function(e){totalDeaths += e.deaths; totalInjured += e.injured});

            headline.html(selectedEvent.location);
            text.html(selectedEvent.description);
            deaths.html(totalDeaths);
            injured.html(totalInjured);
            currentDeaths.html(selectedEvent.deaths);
            currentInjured.html(selectedEvent.injured);

            d3.selectAll(".locator-map circle")
            .remove()

            d3.select(".locator-map")
            .append("circle")
            .attr('cx', mapProjetion([selectedEvent.lon, selectedEvent.lat])[0])
            .attr('cy', mapProjetion([selectedEvent.lon, selectedEvent.lat])[1])
            .attr('r','5px')
            .style('fill', '#ff4e36')
            .style('stroke-width', '3px') 
            .style('stroke', '#FFFFFF'); 

            currentPrintedCircle = currentCircle;
        }  
    }
    else
    {
        let deaths = d3.select('.deaths');
        let injured = d3.select('.injured');
        deaths.html('0');
        injured.html('0');

        currentPrintedCircle = null;
    }
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



