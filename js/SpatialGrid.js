/**
 * Created by Jamie Nichols on 12/19/2015.
 */
(function(){
   var width,height,size,grid,camera;
    var SpatialGrid = function(_camera,_width,_height,_size){
        var obj = {
            init: function (_camera,_width, _height, _size) {
                width = parseInt(_width / _size);
                height = parseInt(_height / _size);
                size = _size;
                grid = [];
                for (var i = 0; i <= width; i++) {
                    grid[i] = [];
                    for (var j = 0; j <= height; j++) {
                        grid[i][j] = [];
                    }
                }
            },
            //Insert Entities in GridSquare
            insert: function (_rect, _ent) {
				if(_rect.x > 0 && _rect.x < width && _rect.y > 0 && _rect.y < height){
					var startX = parseInt(_rect.x / size);
					var startY = parseInt(_rect.y / size);
					var endX = parseInt((_rect.x + _rect.width) / size);
					var endY = parseInt((_rect.y + _rect.height) / size);
					for (var ly = startY; ly <= endY; ly++) {
						for (var lx = startX; lx <= endX; x++) {
							if (grid[x][y].indexOf(_ent) == -1)
								grid[x][y].push(_ent);
						}
					}
				}
            },
            //Retrieve All Other Entities From Gridsquare
            retrieve: function (_rect, _ent) {
                var startX = Math.max(0, parseInt(_rect.x / size));
                var startY = Math.max(0, parseInt(_rect.y / size));
                var endX = Math.min(width, parseInt((_rect.x + _rect.width) / size));
                var endY = Math.min(height, parseInt((_rect.y + _rect.height) / size));
                var entities = [];
                for (var y = startY; y <= endY; y++) {
                    for (var x = startX; x <= endX; x++) {
                        grid[x][y].forEach(function (e) {
                            if (e !== _ent && entities.indexOf(e) == -1)
                                entities.push(e);
                        });
                    }
                }
                return entities;
            },
            //Remove Entity From Gridsquare
            remove: function (_rect, _ent) {
                var startX = Math.max(0, parseInt(_rect.x / size));
                var startY = Math.max(0, parseInt(_rect.y / size));
                var endX = Math.min(width, parseInt((_rect.x + _rect.width) / size));
                var endY = Math.min(height, parseInt((_rect.y + _rect.height) / size));
                for (var y = startY; y <= endY; y++) {
                    for (var x = startX; x <= endX; x++) {
                        for (var i = 0; i < grid[x][y].length; i++) {
                            if (grid[x][y][i] == _ent)
                                grid[x][y].splice(i, 1);
                        }
                    }
                }
            },
            //Getters
            getWidth: function () {
                return width;
            },
            getHeight: function () {
                return height;
            },
            getSize: function () {
                return size;
            }
        }
        obj.init(_camera,_width,_height,_size);
        return obj;
    };

    return SpatialGrid;
})();
