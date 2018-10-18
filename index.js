import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
  return (
    <button data-winning-move={props.winningMove} className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i) {
    return (
      <Square
        winningMove={this.isAWinningMove(i)}
        key={i}
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  isAWinningMove(square_i) {
    return this.props.winningMoves && this.props.winningMoves.some(
      (winningMove, i) => winningMove.indexOf(square_i) > -1
    );
  }

  render() {
    return (
      <div>
        {
           Array(3).fill(null).map((nl, row_i) =>
            <div key={row_i} className="board-row">
              {
                Array(3).fill(null).map((nl, col, row_arr) =>
                  this.renderSquare(row_i * row_arr.length + col)
                )
              }
            </div>
          )
        }
      </div>
    );
  }
}

class MoveList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAscending: true,
    }
  }

  toggleOrder() {
    this.setState({
      isAscending: !this.state.isAscending,
    });
  }

  getOrderText() {
    return this.state.isAscending?
      "Ascending ^"
      :
      "Descending v"
  }

  getOrderedHistory() {
    return this.state.isAscending?
      this.props.history
      :
      this.props.history.slice().reverse()
  }

  render() {
    const moves = this.getOrderedHistory().map((squares, move_i, orderedHistory) => {
      if (!this.state.isAscending) {
        move_i = this.props.history.length - 1 - move_i;
      }
      const move_obj = move_i !== 0 && this.getMove(this.props.history, move_i);
      const desc = move_obj?
        `Player ${move_obj.player} chose row ${move_obj.row} col ${move_obj.col}`
        :
        'Go to game start';
      return (
        <li data-currentmove={this.props.move_i === move_i} key={move_i}>
          <button onClick={() => this.props.jumpTo(move_i)}>
            {desc}
          </button>
        </li>
      );
    });

    return (
      <div className="game-info">
        <button className="toggleMoveListOrder" onClick={() => this.toggleOrder()}>{this.getOrderText()}</button>
        <ol reversed={!this.state.isAscending} className="moves">{moves}</ol>
      </div>
    );
  }

  getMove(history, currentMove) {
    return history[currentMove].reduce(
      function(move, player, i) {
        return move || (
          player &&
          !history[currentMove - 1][i] &&
          {
            player: history[currentMove][i],
            row: Math.floor(i / 3) + 1,
            col: (i % 3) + 1,
          }
        )
      },
      false
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: this.props.history,
      move_i: this.props.move_i,
    };
  }
  render() {
    const history = this.state.history;
    const current = history[this.state.move_i];
    const win = calculateWinner(current);
    const playerSymbol = this.props.players[this.state.move_i % this.props.players.length];
    const status = (
      win?
        `Winner: ${win.player}`
        :
        (
          this.state.move_i === 9 ?
          'Cats game!'
          :
          `Player ${playerSymbol}, choose a square!`
        )
      );

    return (
      <main>
        <h1>TicTacToe</h1>
        <h2>{status}</h2>
        <div className="game">
          <div className="game-board">
            <Board
              winningMoves={win && win.winningMoves}
              squares={current}
              onClick={(i) => this.handleClick(i)}
            />
          </div>
          <MoveList
            jumpTo={(move) => this.jumpTo(move)}
            history={this.state.history}
            move_i={this.state.move_i}
            win={win && win.player}
          />
        </div>
      </main>
    );
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.move_i + 1);
    const current = history[history.length - 1];
    const squares = current.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.props.players[this.state.move_i % this.props.players.length];
    const newHistory = history.concat([squares]);
    this.setState({
      history: newHistory,
      move_i: history.length,
    });
    pushBrowserState({
      history: newHistory,
      move_i: history.length,
      players: this.props.players
    });
  }

  jumpTo(move_i) {
    this.setState({
      move_i: move_i,
    });
    pushBrowserState({
      history: this.state.history,
      move_i: move_i,
      players: this.props.players
    });
  }
}

// ========================================
function initializePage() {
  replaceBrowserState({
    "history": getJSONParam("history") || [Array(9).fill(null)],
    "move_i": getJSONParam("move_i") || 0,
    "players": getJSONParam("players") || ['X','O'],
  });

  ReactDOM.render(
    <Game
      history={window.history.state.history}
      move_i={window.history.state.move_i}
      players={window.history.state.players}
      onClick={(i) => this.handleClick(i)}
    />,
    document.getElementById('root')
  );
}

window.addEventListener('popstate', function() {
  if (
    (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive")
  ) {
    initializePage();
  } else {
    window.addEventListener("DOMContentLoaded", initializePage);
  }
});
initializePage();

function updateBrowserState(fn, state) {
  fn.call(
    window.history,
    state,
    document.title,
    `?
    history=${makeJSONParam(state.history)}
    &move_i=${makeJSONParam(state.move_i)}
    &players=${makeJSONParam(state.players)}
    `.replace(/ /g,'')
  );
}

function pushBrowserState(state) {
  updateBrowserState(window.history.pushState, state);
}

function replaceBrowserState(state) {
  updateBrowserState(window.history.replaceState, state);
}

function getJSONParam(paramKey) {
  return window.location.search.substring(1).split("&").reduce(function(paramValue, param){
      var param_entry = param.split("=");
      if (param_entry[0] === paramKey) {
        return JSON.parse(atob(decodeURIComponent(param_entry[1])));
      } else if (paramValue) {
        return paramValue;
      } else {
        return false;
      }
    },
    false
  );
}

function makeJSONParam(paramValue) {
  return encodeURIComponent(btoa(JSON.stringify(paramValue)));
}

function calculateWinner(squares) {
  var win = {
    player: null,
    winningMoves: []
  };
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      if (!win.player) {
        win.player = squares[a];
      }
      win.winningMoves.push(lines[i]);
    }
  }
  if (win.player) {
    return win;
  }
  return null;
}


