<template>
  <div class="chat">
    <div class="chat__header">
      <div class="chat__header__actions">
        <button
          class="chat__header__actions__new-chat button --wide-secondary"
          @click="clearMessage()"
        >
          <AddButton /> New Chat
        </button>
        <div class="chat__header__actions__contacts">
          <div class="chat__header__actions__contacts__item">
            <MessageSvg />
            <span class="chat__header__actions__contacts__item__name"
              >AI chat Tool</span
            >
          </div>
          <div class="chat__header__actions__contacts__item">
            <MessageSvg />
            <span class="chat__header__actions__contacts__item__name"
              >AI chat Tool</span
            >
          </div>
          <div class="chat__header__actions__contacts__item">
            <MessageSvg />
            <span class="chat__header__actions__contacts__item__name"
              >AI chat Tool</span
            >
          </div>
        </div>
      </div>
      <div class="chat__header__chat"></div>
      <div class="chat__header__user">
        <button
          @click="logout"
          class="chat__header__user__logout button --white"
        >
          <LogoutSvg />Logout
        </button>
        <img src="" alt="" class="chat__header__user__avatar" />
      </div>
    </div>
    <div class="chat__content">
      <div class="chat__content__main">
        <div class="chat__content__main__welcome">
          <h1 class="chat__content__main__welcome__title">VISS AI</h1>
          <img
            src="/logo-black.png"
            alt="logo"
            class="chat__content__main__welcome__icon"
          />
          <p class="chat__content__main__welcome__description">
            STELLA is a multi-agent framework for conversational agents that
            incorporates Large Language Models.
          </p>
        </div>

        <ul v-if="hasMessages" class="chat__content__main__messages">
          <li
            v-for="message in messages"
            :key="message.text"
            :class="{
              chat__content__main__messages__item: true,
              user: message.type === 'user',
              stella: message.type === 'stella',
            }"
          >
            <span class="chat__content__main__messages__item__text">
              {{ message.text }}
            </span>
          </li>
          <li
            v-if="waiting_for_response"
            class="chat__content__main__messages__item stella"
          >
            <LoadingEffect />
          </li>
        </ul>
      </div>
      <div class="chat__content__send">
        <input
          type="text"
          v-model="message"
          :required="true"
          @keyup.enter="sendMessage"
          placeholder="Enter something..."
          class="chat__content__send__input"
        />
        <button @click="sendMessage" class="chat__content__send__button">
          <SendSvg :style="{ color: buttonColor }" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import io from "socket.io-client";
import Session from "~/utils/session";
export default {
  middleware: "authenticated",
  name: "chat",
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
  computed: {
    buttonColor() {
      return this.message ? "#34B990" : "#9FA1A2";
    },
    hasMessages() {
      return this.messages.length > 0;
    },
  },

  methods: {
    //
    clearMessage() {
      console.log("sd");
      this.messages = [];
    },
    //
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
          color: "#00000097",
          size: "1rem",
          text: message,
        });
      }

      this.waiting_for_response = false;
      console.log("message", this.messages);
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
        console.log("user res", response);
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
        const chat = await axios.get(
          this.composeUrl(`workspace/${workspace_id}/chats`),
          {
            headers: this.authHeaders(),
          }
        );
        console.log("chat", chat);
        console.log("response workspace", response);
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
        console.log("response connect workspace", response);
        this.session.workspace_id = workspace_id;
        this.session.saveSession();

        await this.createChat(workspace_id);
        await this.connectToChat();
        console.log("response.data.workspace", response.data.workspace);
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
        console.log("response", response);
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
      if (!this.message) {
        // Handle empty name
        console.error("Name is required!");
        return;
      }
      this.messages.push({
        type: "user",
        color: "#000000",
        size: "1.2rem",
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
      //

      //
      // If the chat id is not provided, use the one from the session
      const chat_id = this.session.chat_id;
      this.message = "";
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

<style lang="scss">
@import "@/assets/scss/_colors.scss";
@import "@/assets/scss/components/button.scss";
.chat {
  display: grid;
  grid-template-columns: 1fr 4fr;
  &__header {
    position: sticky;
    display: flex;
    flex-direction: column;
    border-right: 1px solid $color-grey-light;
    height: 100%;
    &__actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      height: 20%;
      &__new-chat {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.5s ease-in-out;
        .add-button {
          width: 20px;
          height: 20px;
        }
        &:hover {
          border: 0.5px solid $color-black;
          background-color: $color-white;
          color: $color-black;
        }
        &:hover .add-button path {
          stroke: $color-black;
          transition: all 0.5s ease-in-out;
        }
      }

      &__contacts {
        width: 100%;
        padding: 1rem 0 0 2rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        &__item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.25rem;
          &__name {
            font-size: 1rem;
            @media (max-width: 768px) {
              font-size: 0.5rem;
            }
          }
        }
        @media (max-width: 768px) {
          padding: 1rem;
        }
      }
      @media (max-width: 768px) {
        padding: 1rem 0rem;
        height: 30%;
      }
    }
    &__chat {
      height: 70%;
      overflow: scroll;
    }
    &__user {
      height: 10%;
      border-top: 0.25px solid $color-grey-light;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      &__logout {
        width: 80%;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
        .logout-svg {
          width: 20px;
          height: 20px;
        }
        &:hover .logout-svg path {
          stroke: white;
          transition: all 0.5s ease-in-out;
        }
      }

      &__avatar {
      }
    }
  }

  &__content {
    height: 100vh;
    overflow-y: scroll;
    &__main {
      min-height: 80vh;

      &__welcome {
        padding: 1rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
        justify-content: center;
        &__title {
          margin: 0;
        }

        &__icon {
          width: 200px;
          height: 200px;
          object-fit: contain;
        }

        &__description {
          padding: 0;
          @media (max-width: 768px) {
            padding: 0 2rem;
            font-size: .75rem;
          }
        }
      }

      &__messages {
        max-width: 60rem;
        list-style: none;
        padding: 1rem 2rem;
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        gap: 2rem;

        &__item {
          animation: slideUp 0.5s ease-in-out forwards;
          display: flex;

          &__text {
            max-width: 30rem;
            transform: translateY(0);
            border-radius: 2rem;
            display: block;
            padding: 1rem;
            line-height: 1.5;
          }
          &.user {
            justify-content: end;
            .chat__content__main__messages__item__text {
              background-color: $color-green;
              border-bottom-right-radius: 0;
            }
          }
          &.stella {
            justify-content: start;
            .chat__content__main__messages__item__text {
              background-color: #cbcdce;
              border-bottom-left-radius: 0;
            }
          }
        }
      }
    }

    &__send {
      height: 20vh;
      margin: 0 auto;
      width: 70%;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      &__input {
        border-radius: 10px;
        background: $color-grey-faint;
        border: 0;
        color: $color-black;
        padding: 20px;
        width: 100%;
        &:focus {
          outline: none;
        }
        &::placeholder {
          color: $color-grey-mid;
        }
      }

      &__button {
        border: none;
        background: none;
        border-radius: 7px;
        position: absolute;
        right: 5px;
      }
    }
  }
  @media (max-width: 968px) {
    grid-template-columns: 1fr 3fr;
  }
}
@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(100vh);
  }
  1% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
