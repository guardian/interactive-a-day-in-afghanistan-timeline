import * as d3 from 'd3'
import * as d3Select from 'd3-selection'

const isMobile = window.matchMedia('(max-width: 600px)').matches

const topBar = {
    "el": document.querySelector(".interactive-top-bar")
};

const appEl = document.querySelector(".interactive-wrapper");

const barHeight = document.querySelector(".interactive-top-bar").clientHeight;



let events = [];

let padding = {top:0,right:5,bottom:0,left:5};

d3.csv('<%= path %>/assets/A day in Afghanistan - Sheet1.csv').then(function(data)
{
    d3.map(data, function(row){
       let eventTime = new Date();
       eventTime.setHours(row['start time'].split(':')[0])
       eventTime.setMinutes(row['start time'].split(':')[1])
       eventTime.setSeconds(0);

       events.push({eventTime:eventTime, deaths:+row.deaths, injured:+row.injured, lat:row.lat, lon:row.lon, description:row.description})
    })

    makeGrid();

    makeKeyPoints();

    makeDescriptions();
    
    window.requestAnimationFrame(step);

})

function makeGrid()
{
    if(isMobile)
    {
        d3.select('.maps').attr('class', 'column maps mobile');
        d3.select('.tline').attr('class', 'column tline mobile');
        d3.select('.int-content').attr('class', 'column int-content mobile');

        for (var i = 0; i < 24 ; i++) {
            
            let tline = d3.select('.tline')

            makeTimeLine(tline, i)
        }
    }
    else
    {
        //makes 24 divs for each column
        for (var i = 0; i < 24; i++) {
            d3.select('.maps').append('div')
            .attr('class', 'map');

            let tline = d3.select('.tline');

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

function makeDescriptions()
{
    let circles = d3.selectAll('.time-spot').nodes();

    let selectedCircles = circles.filter(c => c.getAttribute('class').indexOf('selected') != -1);

    selectedCircles.map(function(circle){

        let cName = circle.getAttribute('class').split(' ')[2];
        let topPosition = circle.getBoundingClientRect().top ;

        d3.select('.int-content').append('div')
        .attr('class', 'description ' + cName)
        .style('top', topPosition - Math.abs(circles[0].getBoundingClientRect().top) - 100 + 'px')
        .html('description ' + cName);
    })
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

    let circles = d3.selectAll('.time-spot').nodes();

    let visible = circles.filter( c => Math.floor(c.getBoundingClientRect().top) <= Math.floor(window.innerHeight /2))
    let topCircle = visible.slice(-1)[0];

    if(topCircle)
    {
        let currentCircle = topCircle.getAttribute('class');
        d3.select('.interactive-top-bar').html(currentCircle);

        d3.selectAll('.time-spot')
        .attr('r', 3)

        topCircle.setAttribute('r', 7);

        let cName = currentCircle.split(" ")[2];
        let topDescription = d3.select('.description.' + cName);

        if(currentCircle.indexOf('selected')!=-1)
        {
            
            topDescription.attr('class', 'description selected ' + cName)
        }
        else
        {
            topDescription.attr('class', 'description ' + cName)
        }

    }
    else {
        let currentCircle = circles[0].getAttribute('class')
        d3.select('.interactive-top-bar').html(currentCircle);

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
    .attr('r', 3)
    .attr('class', 'time-spot t' + index + "-00")

    let timeLabel = g.append('text')
    .attr('class', 'time-label')
    .attr("x", 15)
    .attr("y", 5)
    .text(index + ":00")
}



