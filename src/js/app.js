import * as d3B from 'd3'
import * as d3Select from 'd3-selection'
import * as d3geo from 'd3-geo'
import * as topojson from 'topojson'
import textures from 'textures'
import grid from './grid'

grid();

let d3 = Object.assign({}, d3B, d3geo);

const isMobile = window.matchMedia('(max-width: 600px)').matches

const topBar = {
    "el": document.querySelector(".interactive-top-bar")
};

const interactiveTimeline = {
    "el": document.querySelector(".interactive-timeline"),
    "timeLine" : document.querySelector(".tline"),
    "intContent" : document.querySelector(".int-content")
}


const appEl = document.querySelector(".interactive-wrapper");

const barHeight = document.querySelector(".interactive-top-bar").clientHeight;

let selectedDate;

let events = [];

let padding = {top:0,right:0,bottom:0,left:0};

let tLineYpos = 0;

let locatorWidth = 300;
let locatorHeight = 215;

let flagPoint;

let currentPrintedCircle;

let mapProjetion = d3.geoMercator()

let worldUrl = "<%= path %>/assets/world-simple.json";



if(isMobile){
    topBar.el.classList.add("mobile");
    interactiveTimeline.intContent.classList.add("mobile");

    flagPoint = 100;

}
else
{
    flagPoint = 100;
}

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

        if(!row["start time"]=="")
        {

            let eventTime = new Date();
            eventTime.setHours(row['start time'].split(':')[0])
            eventTime.setMinutes(row['start time'].split(':')[1])
            eventTime.setSeconds(0);

            selectedDate = new Date();

            events.push({location: row.location, eventTime:eventTime, deaths:+row.deaths, injured:+row.injured, lat:row.lat, lon:row.lon, description:row.description})
        }
    })

    makeGrid();

    if(!isMobile)makeLocator(world);

    window.requestAnimationFrame(step);

}

function makeGrid()
{
    if(isMobile)
    {
        d3.select('.tline').attr('class', 'column tline mobile');
        d3.select('.int-description').attr('class', 'int-description mobile');
    }

    let tline = d3.select('.tline')

    for (var i = 0; i < events.length; i++) {

        let divLine = tline.append('div')
        .attr('class', 'hour d' + i);

        let hourWidth = divLine.node().getBoundingClientRect().width;
        let hourHeight = divLine.node().getBoundingClientRect().height;

        let svg = divLine.append('svg')
        .attr("width", hourWidth + 'px')
        .attr("height", hourHeight + 'px');

        let svgWidth = svg.node().width.animVal.value - padding;

        let g = svg.append('g')

        let minutes = events[i].eventTime.getMinutes();
        let hours = events[i].eventTime.getHours();

        let pTime =  prettyTime(hours, minutes);


        if(!isMobile)
        {
            let timeLabel = g.append('text')
            .attr('class', 'time-label')
            .attr("x", -10)
            .attr("y", 0)
            .text(pTime)
        }
        else
        {
            let timeLabel = g.append('text')
            .attr('class', 'time-label mobile')
            .attr("x", 10)
            .attr("y", 0)
            .text(pTime)
        }



        let circle = g.append('circle')
        .attr('cx', padding.left)
        .attr('cy', padding.top)
        .attr('r', 7)
        .attr('class', 'time-spot t' + events[i].eventTime.getHours() + "-" + events[i].eventTime.getMinutes());


    }
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
    let description = d3.select('.int-description').node();
    let tline = d3.select('.tline').node();
    let yPos = tline.getBoundingClientRect().top;

    if(boundingClient.top <= window.innerHeight/3)
    {
        topBar.el.classList.add("fixed");
    }

    if(boundingClient.bottom <= ((isMobile) ? window.innerHeight/3 : window.innerHeight/3) || boundingClient.top > window.innerHeight/3)
    {
        topBar.el.classList.remove("fixed");
        description.setAttribute('class', 'int-description mobile');
    }

    let circles = d3.selectAll('.time-spot').nodes();
    let visible = circles.filter( c => Math.floor(c.getBoundingClientRect().top) <= flagPoint)
    let topCircle = visible.slice(-1)[0];
    let lastCircle = circles[circles.length-1];
    let bullet = d3.select('.bullet-point').node();

    if(topCircle)
    {

        d3.map(circles, function(c){c.classList.remove('selected')})
        topCircle.classList.add("selected");

        let currentCircle = topCircle.getAttribute('class');

        if(currentCircle.indexOf(' t') != -1 && lastCircle.getBoundingClientRect().top > barHeight){

            tLineYpos = tline.getBoundingClientRect().top;

            if(tLineYpos < 0){
                tLineYpos =  Math.abs(tLineYpos, yPos);
            }
            else{
                tLineYpos = tLineYpos - (tLineYpos * 2);
            }

            let marginTop = tLineYpos + topCircle.getBoundingClientRect().top - 5;
            let bulletTop = marginTop + 4;

            bullet.classList.add("render")

            bullet.setAttribute('style', 'top:' + bulletTop +'px');

            if(!isMobile)
            {
                description.setAttribute('class', 'int-description selected');
            }
            else
            {
                description.setAttribute('class', 'int-description selected mobile');
            }

            printDescription(currentCircle);

        }
    }
    else
    {
        printDescription(null);
        circles[0].classList.remove('selected');
        bullet.classList.remove("render")
    }

    window.requestAnimationFrame(step);
}



function printDescription(currentCircle)
{
    if(currentCircle)
    {

        if(currentPrintedCircle != currentCircle)
        {
            let selectedEventHours = currentCircle.split(" ")[1].split('t')[1].split('-')[0];
            let selectedEventMinutes = currentCircle.split(" ")[1].split('t')[1].split('-')[1];

            selectedDate.setHours(selectedEventHours)
            selectedDate.setMinutes(selectedEventMinutes)
            selectedDate.setSeconds(0);

            let headline = d3.select('.int-description h3');
            let text = d3.select('.content-text-wrapper p');
            let deaths = d3.select('.top-bar-deaths');
            let injured = d3.select('.top-bar-injured');
            let currentDeaths = d3.select('.current-deaths');
            let currentInjured = d3.select('.current-injured');
            let totalDeaths=0;
            let totalInjured=0;

            let selectedEvent = events.find(e => e.eventTime.getHours() == selectedEventHours && e.eventTime.getMinutes() == selectedEventMinutes);
            let pastEvents = events.filter(e => e.eventTime.getTime() <= selectedDate.getTime());

            d3.map(pastEvents, function(e){totalDeaths += e.deaths; totalInjured += e.injured});

            headline.html(selectedEvent.location);
            text.html(selectedEvent.description);
            deaths.html(totalDeaths);
            injured.html(totalInjured);
            currentDeaths.html(selectedEvent.deaths + ' killed');
            currentInjured.html(selectedEvent.injured + ' injured');

            d3.selectAll(".locator-map circle")
            .remove()

            if(!isMobile && selectedEvent.lat.indexOf('?') == -1 )
            {
                makeLocation(selectedEvent.lon, selectedEvent.lat)
            }
            else
            {
                makeLocation(68.088541, 33.191495);
                makeLocation(64.559140, 31.825426);
                makeLocation(66.674865, 32.938463);
            }

            if(isMobile)
            {
                console.log(selectedEventHours,selectedEventMinutes);
                d3.select(".int-description-time").html(prettyTime(selectedEventHours, selectedEventMinutes))
            }

            currentPrintedCircle = currentCircle;
        }
    }
    else
    {

        let deaths = d3.select('.top-bar-deaths');
        let injured = d3.select('.top-bar-injured');

        deaths.html(0);
        injured.html(0);

        currentPrintedCircle = null;

    }
}


function makeLocation(lon, lat)
{
    d3.select(".locator-map")
    .append("circle")
    .attr('cx', mapProjetion([lon, lat])[0])
    .attr('cy', mapProjetion([lon, lat])[1])
    .attr('r','7px')
    .style('fill', '#c70000')
    .style('stroke-width', '3px')
    .style('stroke', '#FFFFFF');
}


function prettyTime(hours, minutes)
{
    let meridian = 'pm';

    if(minutes === 0 || minutes === '0') minutes = '';
    if(minutes > 0 && minutes < 10)minutes = '.0' + minutes;
    if(minutes >= 10)minutes = '.' + minutes;

    if(hours > 12)
    {
        hours = hours -12;
    }
    else if(hours < 12)
    {
        meridian = 'am';
    }

    return hours + minutes + meridian
}
