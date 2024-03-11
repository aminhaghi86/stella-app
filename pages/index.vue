<template>
  <div class="container chat-container">
    <button @click="logout" class="logout-btn">Logout</button>
    <h1>Welcome to Chat!</h1>

    <div class="chat-input">
      <h2>chat</h2>
      <input
        type="text"
        v-model="message"
        @keyup.enter="sendMessage"
        placeholder="Enter something..."
      />
      <button @click="sendMessage" class="send-btn">Send</button>
    </div>
    <hr />
    <ul class="chat-messages">
      <li v-for="message in messages" :key="message.text">
        <span :style="{ color: message.color }">
          {{ message.text }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from "axios";
import io from "socket.io-client";
import Session from "~/utils/session";

export default {
  middleware: "authenticated",
  name: "home",
  data() {
    return {
      should_wait_for_response: true,
      waiting_for_response: false,
      initial_message: null,
      messages: [],
      message: "",
    };
  },

  mounted() {
    const $config = useRuntimeConfig();
    this.config = {
      host: $config.public.SOCKET_HOST,
      port: $config.public.SOCKET_PORT,
      ssl: $config.public.SOCKET_SSL === "true",
      namespace: $config.public.SOCKET_NAMESPACE,
    };

    this.configure();
    this.connect();
  },

  methods: {
    // creates a session manager for login and chat info, and defines the chat path on the server.
    configure() {
      this.socket_url = `${this.config.ssl ? "https://" : "http://"}${
        this.config.host
      }${this.config.port ? `:${this.config.port}` : ""}`;

      this.session = new Session();
      this.session.loadSession();

      this.socketio_namespace = "/chat";
    },
    // The authHeaders method  checks if you're logged in (by looking for an access token in your session data).
    //  If not logged in, it doesn't add any special headers.
    //  But if you are logged in, it creates a special authorization header that tells the server you have permission to chat.
    // This header includes a "Bearer" keyword followed by your access token, kind of like a secret handshake that proves you're allowed to chat.
    // It also adds another header indicating the type of data being sent (JSON).
    authHeaders() {
      // Check if the user is logged in
      if (!this.session.access_token) return {};
      // redirect to login
      return {
        Authorization: `Bearer ${this.session.access_token}`,
        "Content-Type": "application/json",
      };
    },
    // This method (composeUrltakes) a piece of the address (endpoint) like chat or login
    // Combines it with the other known parts to create the full website address you need to send requests to.
    composeUrl(endpoint) {
      return `${this.config.ssl ? "https://" : "http://"}${this.config.host}${
        this.config.port ? `:${this.config.port}` : ""
      }/${endpoint}`;
    },
    // The connect method is similar to beginning a chat session.
    // It first checks if the chat server is ready,
    // Then attempts to reconnect you to the last chat room you used, so you can continue from where you left off.
    async connect() {
      //this.socket.connect();

      try {
        await this.verifyConnection();
        await this.connectLatest();
      } catch (ex) {
        console.error("Restoring connection failed", ex);
      }
    },

    async onConnect(...arg) {
      this.send_message("weather stockholm");
      console.log("on connect", arg);
    },

    async onMessage(...arg) {
      console.log("on message", arg);
      const message = arg[0];
      if (!!message) {
        this.messages.push({
          type: "stella",
          color: "blue",
          text: message,
        });
      }
      this.waiting_for_response = false;
    },

    async onDisconnect(...arg) {
      console.log("on disconnect", arg);
    },
    // verifyConnection method
    // It sends a quick "ping" message to the server to see if it's responding.
    // If it gets a successful response (a 200 code), it means the server is up and ready for chat. If there's no response or something goes wrong
    async verifyConnection() {
      try {
        const response = await axios.get(this.composeUrl("ping"));
        const result = response.status === 200;
        return result;
      } catch (e) {
        return false;
      }
    },

    // connectLatest
    // This method tries to automatically connect you back to your most recently used chat room.
    //  It first checks if you're logged in and then retrieves your user information.
    // If you have a record of the last room you used, it will try to reconnect you to that one.
    //  If there's no record or if something goes wrong, it creates a new default chat room for you and connects you to that instead.
    async connectLatest() {
      if (!this.session.access_token) {
        return;
      }

      try {
        const user = await this.getUser();

        let workspaceId = user.last_workspace_id;
        if (!workspaceId) {
          const response = await axios.post(
            this.composeUrl(`workspace`),
            { name: "default-workspace" },
            { headers: this.authHeaders() }
          );
          workspaceId = response.data.workspace.id;
        }
        console.log(workspaceId);

        const workspace = await this.getWorkspaceById(workspaceId);
        this.session.workspace_id = workspace.id;
        this.session.saveSession();
        this.connectToWorkspace(workspace.id);
        return;
      } catch (e) {
        throw new Error("User not found. Please login again.", e);
      }
    },
    // getUser Method
    // When you're logged in, this method fetches details about your user account.
    // It sends a secure request to the server and, if successful (response code 200), it returns your user information
    async getUser() {
      try {
        const response = await axios.get(this.composeUrl("user"), {
          headers: this.authHeaders(),
        });

        return response.data.user;
      } catch (e) {
        throw new Error(
          `Request to get a user failed with status code: ${e.statusCode}, Message: ${e.response.body}`
        );
      }
    },
    // This getWorkspaceById method lets you get information about a particular chat room by providing its unique ID.
    // It sends a request to the server with the ID, and if successful (response code 200), it returns the details about that chat room.
    async getWorkspaceById(workspace_id) {
      try {
        const response = await axios.get(
          this.composeUrl(`workspace/${workspace_id}`),
          {
            headers: this.authHeaders(),
          }
        );

        return response.data.workspace;
      } catch (e) {
        throw new Error(`Failed to get workspace. (${e.statusCode}).`);
      }
    },
    //  connectToWorkspace method
    // It's like joining a special chat room. First, it finds out about the room you picked using its ID, saves that ID on your device, makes a new chat space for that room,
    // Then links you to it. Then, you can start chatting in that room, sending and getting messages.
    async connectToWorkspace(workspace_id) {
      try {
        const response = await axios.get(
          this.composeUrl(`workspace/${workspace_id}`),
          {
            headers: this.authHeaders(),
          }
        );

        this.session.workspace_id = workspace_id;
        this.session.saveSession();

        await this.createChat(workspace_id);
        await this.connectToChat();

        return response.data.workspace;
      } catch (ex) {
        console.log(`Failed to get workspace.`, ex);
        return;
      }
    },
    // Creates a new chat session
    // This method createChat, lets you start a new chat. It sends a request to the server with the workspace ID we provide.
    // If successful (meaning the server responds with a 200 code), it retrieves the chat ID assigned by the server and stores it in your local storage.
    // It then returns the chat ID, which is likely used to connect to that specific chat session later.
    async createChat(workspace_id) {
      try {
        const response = await axios.post(
          this.composeUrl(`chat?workspace_id=${workspace_id}`),
          {},
          { headers: this.authHeaders() }
        );

        if (response.status === 401) {
          // redirect
        } else if (response.status != 200) {
          throw new Error(
            "Request to create a new chat failed with, Message: " +
              response.statusText
          );
        }

        const chat_id = response.data.chat.chat_id;
        if (!chat_id) {
          throw new Error(
            "Chat ID is was not returned from the server. Critical error, aborting."
          );
        }

        this.session.chat_id = chat_id;
        this.session.saveSession();
        return chat_id;
      } catch (ex) {
        throw new Error(`Failed to create chat. (${ex}).`);
      }
    },

    // The connectToChat method sets up a realtime connection to the chat server for a particular chat session.
    // It gets a secure connection string, creates a s connection, and adds listeners for messages and connection changes.

    async connectToChat() {
      try {
        // if (this.socket.connected) {
        //   await this.socket.disconnect();
        // }

        const connectionString = await this.getConnectionString(
          this.session.chat_id
        );
        console.log("connect...");

        const ioConfig = {
          query: {
            chat_id: this.session.chat_id,
            connection_string: connectionString,
          },
        };

        this.socket = io(
          `${this.socket_url}/chat?namespace=${this.config.namespace}&chat_id=${this.session.chat_id}&connection_string=${connectionString}`,
          ioConfig
        );

        this.socket
          .on("connect", this.onMessage)
          .on("disconnect", this.onDisconnect)
          .on("message", this.onMessage);

        this.socket.onAny((eventName, ...args) => {
          console.log("IO", [eventName, args, this.socket]);
        });
      } catch (error) {
        console.error("Chat connection failed:", error);
        throw new Error(`Failed to create chat. (${error}).`);
      }
    },

    // This method fetches a unique identifier (connection string) required to connect to a specific chat session on the server
    // It first builds a secure request with authentication headers, then retrieves the connection string from the server's response.
    // If successful, it stores the connection string and returns it for establishing the WebSocket connection.
    // Any errors during the process are caught and reported for debugging.
    async getConnectionString(chatId) {
      try {
        const url = this.composeUrl(`chat/authorize?chat_id=${chatId}`);
        const response = await axios.get(url, {
          headers: this.authHeaders(),
        });
        if (response.status === 401) {
          console.error("You are not authenticated. Please login.");
          return null; // Or throw an error if preferred
        } else if (response.status !== 200) {
          throw new Error(
            `Request to get chat connection authorization failed. Status code: ${this.response.status}, Message: ${this.response.data}`
          );
        }
        const connectionString = response.data.string;
        this.session.chat_connection_string = connectionString;
        this.session.saveSession();
        return connectionString;
      } catch (ex) {
        console.error("Error fetching connection string:", ex);
        throw new Error(`Failed to create chat. (${ex}).`);
      }
    },
    // The sendMessage method  sends a message to the chat server, ensuring authentication and proper message authorization along the way.
    // At first verifies that you're connected to a chat,
    // Fetches a unique message authorization string from the server, constructs a secure message object with the authorization details,
    // And then transmits the message through the established WebSocket connection, awaiting a response from the server.
    async sendMessage() {
      const message = this.message;
      this.messages.push({
        type: "user",
        color: "red",
        text: message,
      });
      // Check if we're currently connected to a chat/workspace
      if (this.session.chat_id === null || this.session.workspace_id === null) {
        console.error("You are not connected to a chat or workspace.");
        return;
      }
      // If we're waiting for a response, don't send another message
      if (this.waiting_for_response) {
        return;
      }

      // If the chat id is not provided, use the one from the session
      const chat_id = this.session.chat_id;

      try {
        // Get a message authorization string from the server
        const response = await axios.get(
          this.composeUrl(`chat/authorize/message?chat_id=${chat_id}`),
          {
            headers: this.authHeaders(),
          }
        );

        if (response.status === 401) {
          console.error("You are not authenticated. Please login.");
          return;
        }

        if (response.status !== 200) {
          throw new Error(
            `Request to get a message authorization string failed with status code: ${response.status}, Message: ${response.data}`
          );
        }

        this.session.chat_message_string = response.data.string;
        this.session.saveSession();
        // Send the message
        const json_data = {
          message: message,
          chat_id: chat_id,
          message_string: this.session.chat_message_string,
        };

        this.socket.emit("chat_message", JSON.stringify(json_data));
        this.waiting_for_response = true;
        this.message = "";
      } catch (error) {
        console.error(error);
      } finally {
      }
    },
    // The Logout methods  cleans out any chat session details stored on your device form localstorage and
    // brings you back to the starting point where you can  login again!
    logout() {
      localStorage.removeItem("session");
      navigateTo("/login");
    },
  },
};
</script>

<style scoped>
.container {
  background: linear-gradient(40deg, #ccc, #ccc, #cddd);
  max-height: 100vh;
  padding: 1rem;
}
.chat-container {
  border: 1px solid #ddd;
  border-radius: 5px;
  margin: 0 auto;
  max-width: 960px;
  text-align: center;
  overflow: scroll;
  height: 100vh;
}

.logout-btn {
  background-color: #f00;
  color: #fff;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.chat-input {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  text-align: center;
  gap: 10px;
}
.chat-input input {
  padding: 8px 16px;
  border: none;
  border-bottom: 1px solid #cccccc90;
}
.chat-input input:focus {
  outline: none;
}

.send-btn {
  background-color: #4caf50;
  color: #fff;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 10px;
}

.chat-messages {
  list-style: none;
  padding: 0;
  margin: 0;
}

.chat-messages li {
  margin-bottom: 10px;
  text-align: left;
}
</style>
