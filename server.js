const app = require('express')();
const uuidv1 = require('uuid/v1');
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 4001;
server.listen(port);

let users = []


const removeUser = (id) => {
  return users.filter(( c ) => c.id !== id);
}

const getUser = (id) => {
  return users.find(u => u.id === id)
}

const checkIfExist = (id) => Boolean(users.find(u => u.id === id))

/**
 * For each new connection, this event will be fired
 * @param  {client}
 * A unique identifier for the session, that comes from the underlying Client
 */
io.on("connection", function (client) {

  console.info("new connection", client.id)

  /**
   * User join to chat
   * @param  { name: string, avatar: string}
   */
  client.on("user.join", function(data) {

    // Check if user alhead exists
    if (checkIfExist(client.id)) {
      console.error('user alhead exists');
      removeUser(client.id)

    }


    if (users.length === 2) {
      users = [];
      return client.emit('application.error', 'Maximum two players onlyne');
    }

    // Create the new user object and generate a random color for him
    const user = {
      id: client.id,
      name: data.name,
      choice: '',
    }

    users.push(user);

    client.emit("user.join", users);
    client.broadcast.emit("users.join", users);

  });


  client.on("user.choose", (data) => {
    users = users.map(u => {
      if (u.id === client.id) {
        return Object.assign(u, { choice: data })
      }
      return u;
    })

    client.emit("user.update", users)
    client.broadcast.emit("users.update", users)

  })

  client.on("play", (data) => {
    const result = computeGame(users);
    client.emit("result", result)
    client.broadcast.emit("result", result)

  })

  client.on("disconnect", (data) => {
    if (checkIfExist(client.id)) {
      users = removeUser(client.id)

      client.broadcast.emit("user.disconnect", users)
      console.log(`user ${client.id} was disconnected`)
    }

  });
});

function computeGame(players) {

  const player1 = players[0];
  const player2 = players[1];

	const choice1 = player1.choice;
	const choice2 = player2.choice;

	if (choice1 === choice2) {
		return 'draw';
	}
	if (choice1 === "rock") {
		if (choice2 === "scissors") {
			return { winner: player1, loser: player2};
		} else {
			return { winner: player2, loser: player1};
		}
	}
	if (choice1 === "paper") {
		if (choice2 === "rock") {
			return { winner: player1, loser: player2};
		} else {
			return { winner: player2, loser: player1};
		}
	}
	if (choice1 === "scissors") {
		if (choice2 === "rock") {
			return { winner: player2, loser: player1};
		} else {
			return { winner: player1, loser: player2};
		}
	}
}
