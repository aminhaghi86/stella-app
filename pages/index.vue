<template>
  <div class="container chat-container">
    <button @click="logout" class="logout-btn">Logout</button>
    <h1>Welcome to Chat!</h1>

    <div class="chat-input">
      <h2>chat</h2>
      <input type="text" v-model="message" @keyup.enter="sendMessage" placeholder="Enter something..." />
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
    configure() {
      this.socket_url = `${this.config.ssl ? "https://" : "http://"}${
        this.config.host
      }${this.config.port ? `:${this.config.port}` : ""}`;

      this.session = new Session();
      this.session.loadSession();

      this.socketio_namespace = "/chat";
    },

    authHeaders() {
      // Check if the user is logged in
      if (!this.session.access_token) return {};
      // redirect to login
      return {
        Authorization: `Bearer ${this.session.access_token}`,
        "Content-Type": "application/json",
      };
    },

    composeUrl(endpoint) {
      return `${this.config.ssl ? "https://" : "http://"}${this.config.host}${
        this.config.port ? `:${this.config.port}` : ""
      }/${endpoint}`;
    },

    async connect() {
      //        this.socket.connect();

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

    async verifyConnection() {
      try {
        const response = await axios.get(this.composeUrl("ping"));
        const result = response.status === 200;
        return result;
      } catch (e) {
        return false;
      }
    },

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
    logout() {
      localStorage.removeItem("session");
      navigateTo("/login");
    },
  },
};
</script>

<style scoped>
.container{
  background: linear-gradient(40deg,#ccc,#ccc,#cddd);
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
