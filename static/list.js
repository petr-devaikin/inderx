
var parts = d3.select('.m-participants').selectAll('.m-participant-r').data(data)
    .enter()
        .append('a')
            .attr('href', function(d) { return d.id; })
            //.attr('target', '_black')
            .classed('m-participant', true);

parts.append('div')
    .classed('m-participant__id', true)
    .text(function (d) { return d.id; });

parts.append('div')
    .classed('m-participant__start', true)
    .text(function (d) { return (new Date(d.registred)).toLocaleString(); });

parts.append('div')
    .classed('m-participant__pref', true)
    .text(function (d) { return d.preference; });

parts.append('div')
    .classed('m-participant__shows', true)
    .text(function (d) { return d.shows.filter(function(a) { return a.finish; }).length; });
