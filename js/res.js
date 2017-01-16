var PIXEL_PER_SECOND = 10;

data = data.filter(function(a) { return a.finish; });

var shows = d3.select('.m-shows').selectAll('.m-show').data(data)
    .enter()
        .append('div')
            .classed('m-show', true);


shows
    .style('width', function(d) {
        var start = new Date(d.start);
        var finish = new Date(d.finish);
        return PIXEL_PER_SECOND * (finish - start) / 1000 + 'px';
    });

shows
    .append('div')
    .classed('result', true)
    .classed('like', function(d) { return d.result == 'like'; })
    .classed('dislike', function(d) { return d.result == 'dislike'; })
    .classed('superlike', function(d) { return d.result == 'superlike'; });

shows
    .append('div')
    .classed('overall', true)
    .text(function(d) {
        var start = new Date(d.start);
        var finish = new Date(d.finish);
        var res = (finish - start) / 1000;
        var s = Math.floor(res / 60) + ":";
        if (Math.round(res % 60) < 10)
            s += "0";
        return s + Math.round(res % 60);
    });
