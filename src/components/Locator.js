class Locator
{
	static makeLocator(d3, geojson, map, locatorWidth, locatorHeight, locatorSvg, textures, selections, merged)
	{
		let country = geojson.features.find((country) => d3.geoContains(country, [map.getCenter().lng,map.getCenter().lat]));
		let mapProjetion = d3.geoMercator().fitSize([locatorWidth, locatorHeight], country);
		let mapPath = d3.geoPath().projection(mapProjetion);

		locatorSvg.selectAll('*').remove()

		let ne = map.getBounds()._ne;
		let sw = map.getBounds()._sw;

		let topRight = mapProjetion([ne.lng,ne.lat]);
		let bottomLeft = mapProjetion([sw.lng, sw.lat])

		let rectHeight = bottomLeft[1] - topRight[1];
		let rectWidth = topRight[0] - bottomLeft[0];

		let texture = textures
		.lines()
		.size(6)
		.strokeWidth(1)
		.stroke('#DADADA');

		selections.call(texture);

		if(rectWidth && rectHeight && rectWidth > 0 && rectHeight > 0 && rectWidth <= locatorWidth)
		{
			locatorSvg.append("path")
			.datum(country)
			.attr("d", mapPath)
			.attr('fill', '#F6F6F6');

			locatorSvg.append("path")
			.datum(country)
			.attr("d", mapPath)
			.style('fill', texture.url());

			locatorSvg.append("path")
			.datum(country)
			.attr("d", mapPath)
			.attr('stroke', '#333333')
			.attr('stroke-width', '1.5px')
			.attr('stroke-linejoin', 'round')
			.style('fill', 'none');

			locatorSvg.append("rect")
			.attr('class','boundingBox')
			.attr('width', rectWidth)
			.attr('height', rectHeight)
			.attr('x', bottomLeft[0])
			.attr('y', topRight[1])
			.attr('stroke', '#CC0A11')
			.attr('stroke-width', '2px')
			.attr('fill', 'none')
		}
		else
		{
			

			let projection = d3.geoOrthographic()
		    .translate([locatorWidth / 2, locatorHeight / 2])
		    .scale(locatorHeight/2)
		    .clipAngle(90 - 1e-3)
		    .rotate([-map.getCenter().lng, -map.getCenter().lat]);


		    let path = d3.geoPath().projection(projection);

		    locatorSvg.append("path")
		    .datum({type: "Sphere"})
		    .attr('d', path)
		    .attr('fill', '#FFFFFF')

		    locatorSvg.append("path")
			.datum(merged)
			.attr("d", path)
			.attr('fill', '#F6F6F6')

			locatorSvg.append("path")
			.datum(merged)
			.attr("d", path)
			.style('fill', texture.url());

			locatorSvg.append("path")
			.datum(merged)
			.attr("d", path)
			.attr("class", 'simplify')
			.attr('stroke', '#333333')
			.attr('stroke-width', '0.5px')
			.attr('stroke-linejoin', 'round')
			.style('fill', 'none');

			locatorSvg.append("path")
		    .datum({type: "Sphere"})
		    .attr('d', path)
		    .attr('fill', 'none')
		    .attr('stroke', '#333333')
			.attr('stroke-width', '1.5px')
			.attr('stroke-linejoin', 'round')

			let bounds = map.getBounds();

			let nw = [bounds._sw.lng, bounds._ne.lat]
			let ne = [bounds._ne.lng, bounds._ne.lat]
			let se = [bounds._ne.lng, bounds._sw.lat]
			let sw = [bounds._sw.lng, bounds._sw.lat]

			locatorSvg.append("path")
			.datum({type: 'LineString', coordinates: [nw,ne,se,sw,nw]})
			.attr('d', path)
			.attr('stroke', '#CC0A11')
			.attr('stroke-width', '2px')
			.attr('fill', 'none')
			
		}
		if(rectWidth <= 6 && rectWidth > 0)
		{
			locatorSvg.selectAll('.boundingBox').remove()

			locatorSvg.append('rect')
			.attr('class','pinPoint')
			.attr('width', 7.5)
			.attr('height', 7.5)
			.attr('x', bottomLeft[0] - 3)
			.attr('y', topRight[1] - 3)
			.attr('fill','#CC0A11')
		}

	}

}

export default  Locator ;