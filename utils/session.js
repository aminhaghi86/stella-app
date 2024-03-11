export default class Session {
  constructor() {
    this.access_token = null;
    this.username = null;
    this.workspace_id = null;
    this.chat_id = null;
    this.chat_connection_string = null;
    this.chat_message_string = null;

    this.loadSession();
  }
  // loadSession method
  // It first checks your device's local storage for a file named "session" where chat info is stored. If it doesn't find the file, it creates a new empty one.
  // Then, it tries to read the contents of the file and extract important details like your access token
  // (for logging in), username, workspace ID (chat room), chat ID, and connection strings for chat communication.
  loadSession() {
    const session = localStorage.getItem("session");
    if (!session) {
      localStorage.setItem("session", JSON.stringify({}));
    }

    try {
      const sessionData = JSON.parse(session);
      this.access_token = sessionData.access_token || null;
      this.username = sessionData.username || null;
      this.workspace_id = sessionData.workspace_id || null;
      this.chat_id = sessionData.chat_id || null;
      this.chat_connection_string = sessionData.chat_connection_string || null;
      this.chat_message_string = sessionData.chat_message_string || null;
    } catch (e) {
      console.error(`(Session error: ${e})`);
      console.info("Could not load session file. Generating a new one.");
      return {};
    }
  }
  // saveSession Method
  // It grabs all your  chat details (like login token, username, chat room ID, and connection strings),
  // And stores them in your device's localstorage with the name "session".
  saveSession() {
    localStorage.setItem(
      "session",
      JSON.stringify(
        {
          access_token: this.access_token,
          username: this.username,
          workspace_id: this.workspace_id,
          chat_id: this.chat_id,
          chat_connection_string: this.chat_connection_string,
          chat_message_string: this.chat_message_string,
        },
        null,
        4
      )
    );
  }
}
