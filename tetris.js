const BLOCK_PADDING = 3;


function print_board(board) {
  console.log(board.reduce((a, c) => `${a}\n` + c.reduce((a,c) => `${a} ${c.hasPiece}`, ''), ''));
}

function getCoords(matrix) {
  var coords = [];
  for (var i = 0; i < matrix.length; i++) {
    for (var j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] == 1) {
        coords.push([i,j]);
      }
    }
  }
  return coords;
}

function coords_to_matrix(coords, size) {
  var matrix = Array.from({
      length: size
    }, () => new Array(size).fill(0));
  coords.forEach((coord) => {
    matrix[coord[0]][coord[1]] = 1;
  });
  return matrix;
}

function rotateCW(matrix) {
  var copy = _.cloneDeep(matrix);
  var size = matrix.length;
  for (var i = 0; i < Math.floor(size/2); i++) {
    for (var j = i; j < size - i - 1; j++) {
      // console.log(i,j, size, coords)
      let top = copy[i][j];

      // Move left to top
      copy[i][j] = copy[size-j-1][i];

      // Move bottom to left
      copy[size-j-1][i] = copy[size-i-1][size-j-1];
      //
      // // Move right to bottom
      copy[size-i-1][size-j-1] = copy[j][size-i-1];
      //
      // // Move top to right
      copy[j][size-i-1] = top;
    }
  }
  return copy
}

class Board {
  constructor(target) {
    this.target = target;
    this.target_ctx = target.getContext("2d");
    this.target.height = 800;
    this.target.width = 520;
    this.config = {
      interval: 1000,
      block_size: 40,
      x_grids: this.target.width / 40,
      y_grids: this.target.height / 40,
      starting_location: [10,0]
    }
    this.active_piece = null;
    this.board =  Array.from({
        length: this.config.y_grids
      }, () => Array.from({length: this.config.x_grids}, () => { return { hasPiece: 0}; }));

    // print_board(this.board)
  }

  create_random_piece() {
    var piece_factories = Object.keys(_pieces);
    var idx = Math.floor(Math.random() * piece_factories.length);
    return _pieces[piece_factories[idx]]();
  }

  clear() {
    this.target_ctx.clearRect(0, 0, this.target.width, this.target.height);
  }

  draw() {
    this.clear();
    this.target_ctx.beginPath();
    this.active_piece.piece.draw(
      this.target_ctx,
      this.active_piece.x * this.config.block_size,
      this.active_piece.y * this.config.block_size,
      this.config.block_size);
    this.target_ctx.closePath();
    for (var i = 0; i < this.board.length; i++) {
      for (var j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j].hasPiece == 1) {
          this.target_ctx.beginPath();
          let tly = i * this.config.block_size;
          let tlx = j * this.config.block_size;
          this.target_ctx.rect(tlx+BLOCK_PADDING,tly+BLOCK_PADDING,this.config.block_size-BLOCK_PADDING*2,this.config.block_size-BLOCK_PADDING*2);
          this.target_ctx.lineWidth=BLOCK_PADDING*2 - 1.5;
          this.target_ctx.strokeStyle = this.board[i][j].color;
          this.target_ctx.stroke();
          this.target_ctx.closePath();
        }
      }
    }
    // this.pieces.forEach((piece) => {
    //   this.target_ctx.beginPath();
    //   piece.piece.draw(
    //     this.target_ctx,
    //     piece.x * this.config.block_size,
    //     piece.y * this.config.block_size,
    //     this.config.block_size);
    //   this.target_ctx.closePath();
    // });
    // console.log(this.active_piece)
    // console.log(getCoords(this.active_piece.piece.matrix))
  }

  start() {
    this.game = setInterval(this.round.bind(this), this.config.interval);
    $(document).keydown(this.key_press.bind(this));
  }

  get_matrix() {

  }

  key_press(e) {
    let key = e.which;
    var updated_piece = {matrix: this.active_piece.piece.matrix, x: 0, y: 0};
    if (key == 37) {
      // left
      updated_piece.x = -1;
    } else if (key == 38) {
      // up
      updated_piece.matrix = rotateCW(this.active_piece.piece.matrix);
      updated_piece = this.adjust_boundary(updated_piece);
    } else if (key == 39) {
      // right
      updated_piece.x = 1;
    } else if (key == 40) {
      // down
      updated_piece.y = 1;
    } else if (key == 32) {
      // space, rotate
    } else {
      return
    }
    if (this.within_bounds(updated_piece) && this.collision_free(updated_piece)) {
      this.active_piece.x += updated_piece.x;
      this.active_piece.y += updated_piece.y;
      this.active_piece.piece.matrix = updated_piece.matrix;
      // this.adjust_boundary();
      this.draw();
    }
  }

  adjust_boundary(updated_piece) {
    var minY = Number.MAX_VALUE, maxY = Number.MIN_VALUE;
    getCoords(updated_piece.matrix).forEach((coord) => {
      minY = Math.min(minY, coord[1]);
      maxY = Math.max(maxY, coord[1]);
    });
    var left = this.active_piece.x + updated_piece.x + minY;
    var right = this.active_piece.x + updated_piece.x + maxY;
    if (left < 0) {
      updated_piece.x += Math.abs(left);
    }
    if (right >= this.config.x_grids) {
      updated_piece.x -= (right - this.config.x_grids + 1);
    }
    return updated_piece;
  }

  // adjust_boundary() {
  //   var minY = Number.MAX_VALUE, maxY = Number.MIN_VALUE;
  //   getCoords(this.active_piece.piece.matrix).forEach((coord) => {
  //     minY = Math.min(minY, coord[1]);
  //     maxY = Math.max(maxY, coord[1]);
  //   });
  //   var left = this.active_piece.x + minY;
  //   var right = this.active_piece.x + maxY;
  //   if (left < 0) {
  //     this.active_piece.x += Math.abs(left);
  //   }
  //   if (right >= this.config.x_grids) {
  //     this.active_piece.x -= (right - this.config.x_grids + 1);
  //   }
  // }

  collision_free(updated_piece) {
    var x, y, collision_free = true;
    x = updated_piece.x + this.active_piece.x;
    y = updated_piece.y + this.active_piece.y;
    getCoords(updated_piece.matrix).forEach((coord) => {
      if (this.board[coord[0]+y][coord[1]+x].hasPiece == 1) {
        collision_free = false
      }
    });
    return collision_free;
  }

  within_bounds(updated_piece) {
    var minX = Number.MAX_VALUE, maxX = Number.MIN_VALUE, minY = Number.MAX_VALUE, maxY = Number.MIN_VALUE;
    getCoords(updated_piece.matrix).forEach((coord) => {
      maxX = Math.max(maxX, coord[0]);
      minX = Math.min(minX, coord[0]);
      minY = Math.min(minY, coord[1]);
      maxY = Math.max(maxY, coord[1]);
    });
    var left = this.active_piece.x + updated_piece.x + minY;
    var right = this.active_piece.x + updated_piece.x + maxY;
    var bottom = this.active_piece.y + updated_piece.y + maxX;
    return (updated_piece.y == 0 && left >= 0 && right < this.config.x_grids) || (updated_piece.x == 0 && bottom < this.config.y_grids);
  }

  piece_dead() {
    var maxY = Number.MIN_VALUE;
    var bottom = [];
    getCoords(this.active_piece.piece.matrix).forEach((coord) => {
      maxY = Math.max(maxY, coord[0]);
    });
    if (this.active_piece.y + maxY == this.config.y_grids - 1) {
      return true
    }
    // Has piece underneath
    return getCoords(this.active_piece.piece.matrix).some((coord) => {
      return this.board[this.active_piece.y+coord[0]+1][this.active_piece.x+coord[1]].hasPiece == 1
    });
  }

  game_over() {

  }

  pause() {
    clearTimeout(this.game);
  }

  user_action() {

  }

  move_active() {
    this.key_press({which: 40});
  }

  update_board(active_piece) {
    var x = this.active_piece.x;
    var y = this.active_piece.y;
    this.active_piece.piece.getCoords().forEach((coord) => {
      this.board[coord[0]+y][coord[1]+x] = {hasPiece: 1, color: this.active_piece.piece.color};
    });
  }

  clear_complete_lines() {
    var removeLines = [];
    for (var i = this.board.length-1; i >=0; i--) {
      if (this.board[i].every((x) => x.hasPiece == 1)) {
        removeLines.push(i);
      }
    }



    // print_board(this.board)
    removeLines.forEach((line) => {
      this.board.splice(line, 1);
    });

    removeLines.forEach(() => {
      this.board.unshift(Array.from({length: this.config.x_grids}, () => { return { hasPiece: 0}; }));
    });
    // print_board(this.board)

    // clear lines
    // for (var i = 0; i < clearLines; i++) {
    //   this.board.pop();
    //   this.board.unshift(Array.from({length: this.config.x_grids}, () => { return { hasPiece: 0}; }));
    // }
  }

  round() {
    if (this.active_piece == null || this.piece_dead()) {
      if (this.active_piece != null) {
        this.update_board(this.active_piece);
        this.clear_complete_lines();
      }
      this.active_piece = {
        x: Math.ceil(this.config.x_grids / 3),
        y: 0,
        piece: this.create_random_piece()
      };
    }
    this.move_active();
    this.draw();
  }
}

class Piece {

  constructor(size, coords, color) {
    this.size = size;
    this.color = color
    this.matrix = coords_to_matrix(coords, size);
    this.center = Math.floor(size / 2);
    this.symmetric = (size % 2 != 0);
  }

  draw(ctx, x, y, length) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.matrix[i][j] == 1) {
          let tly = y + i * length;
          let tlx = x + j * length;
          ctx.rect(tlx+BLOCK_PADDING,tly+BLOCK_PADDING,length-BLOCK_PADDING*2,length-BLOCK_PADDING*2);
          ctx.lineWidth=BLOCK_PADDING*2 - 1.5;
          ctx.strokeStyle = this.color;
          ctx.stroke();
        }
      }
    }
  }

  getCoords() {
    return getCoords(this.matrix);
  }
}

var _pieces = {
  I: () => new Piece(4, [[1,0], [1,1], [1,2], [1,3]], '#42f4eb'),
  L: () => new Piece(3, [[0,0], [1,0], [1,1], [1,2]], 'blue'),
  RL: () => new Piece(3, [[0,2], [1,0], [1,1], [1,2]], 'orange'),
  S: () => new Piece(2, [[0,0], [0,1], [1,0], [1,1]], '#c6bd09'),
  Z: () => new Piece(3, [[1,0], [1,1], [0,1], [0,2]], 'red'),
  RZ: () => new Piece(3, [[0,0], [0,1], [1,1], [1,2]], 'green'),
  T: () => new Piece(3, [[0,1], [1,0], [1,1], [1,2]], 'purple'),
}

$(document).ready(() => {
  var board = new Board($('.tetris-board')[0]);
  board.start();
});
