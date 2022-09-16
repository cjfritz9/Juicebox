const { 
    client,
    getAllUsers,
    createUser,
    updateUser,
    getUserById,
    getAllPosts,
    getPostsByUser,
    updatePost,
    getPostById,
    createPost,
    createTags,
    addTagsToPost,
} = require('./index');

const dropTables = async () => {
    try {
      console.log("Starting to drop tables...");

        await client.query(`
          DROP TABLE IF EXISTS post_tags;
          DROP TABLE IF EXISTS tags;
          DROP TABLE IF EXISTS posts;
          DROP TABLE IF EXISTS users;
        `);

        console.log("Finished dropping tables.");
    } catch (err) {
        console.error("Error dropping tables.");
        throw err;
    }
};

const createTables = async () => {
    try {
      console.log("Starting to build tables...")
    
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT true
        );

        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          "authorId" INTEGER REFERENCES users(id) NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          active BOOLEAN DEFAULT true
        );

        CREATE TABLE tags (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL
        );

        CREATE TABLE post_tags (
          "postId" INTEGER REFERENCES posts(id),
          "tagId" INTEGER REFERENCES tags(id),
          UNIQUE ("postId", "tagId")
        );

      `);

      console.log("Finished building tables.");
    } catch (err){
      console.log("Error building tables.");
      throw err;
    }
};

const createInitialUsers = async () => {
  try {
    console.log("Starting to create users...")

    await createUser({ 
      username: 'albert', 
      password: 'bertie99',
      name: 'Al Bert',
      location: 'Sidney, Australia' 
    });
    await createUser({ 
      username: 'sandra', 
      password: '2sandy4me',
      name: 'Just Sandra',
      location: "Ain't tellin'"
    });
    await createUser({ 
      username: 'glamgal',
      password: 'soglam',
      name: 'Joshua',
      location: 'Upper East Side'
    });

    console.log("Finished creating users!");
  } catch (err) {
    console.error("Error creating users.");
    throw err;
  }
}

const createInitialPosts = async () => {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();

    console.log("Starting to create posts...")
    await createPost({
      authorId: albert.id,
      title: "First Post",
      content: "This is my first post. I hope I love writing blogs as much as I love writing them."
    });

    await createPost({
      authorId: sandra.id,
      title: "How does this work?",
      content: "Seriously, does this even do anything?"
    });

    await createPost({
      authorId: glamgal.id,
      title: "Living the Glam Life",
      content: "Do you even? I swear that half of you are posing."
    });
    
    console.log("Finished creating posts.");
  } catch (error) {
    console.log("Error creating posts.");
    throw error;
  }
}

const createInitialTags = async () => {
  try {
    console.log('Starting to create tags...');

    const [happy, sad, inspo, catman] = await createTags([
      '#happy',
      '#worst-day-ever',
      '#youcandoanything',
      '#catmandoeverything'
    ]);

    const [postOne, postTwo, postThree] = await getAllPosts();

    await addTagsToPost(postOne.id, [happy, inspo]);
    await addTagsToPost(postTwo.id, [sad, inspo]);
    await addTagsToPost(postThree.id, [happy, catman, inspo]);
    console.log(await postOne);

    console.log('Finished creating tags.');
  } catch (err) {
    console.log('Error creating tags.');
    throw err;
  }
}

const rebuildDB = async () => {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
    await createInitialTags();
  } catch (err) {
    throw err;
  }
};

const testDB = async () => {
  try {
    console.log("Starting the test database...");

    const users = await getAllUsers();
    console.log("Get Users Result:", users);

    console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: 'Newname Sogood',
      location: 'Lesterville, KY'
    });
    console.log("Update User Result:", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Get All Posts Result:", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Editing this post for good measure!"
    });
    console.log("Update Post Result:", updatePostResult);

    const albert = await getUserById(1);
    console.log("Get User By ID Result:", albert);

    const getPostsByUserResult = await getPostsByUser(1)
    console.log("Get Posts By User Result:", getPostsByUserResult);

    console.log("Finished database tests.");
  } catch (err) {
    console.error("Error testing database.");
    throw err;
  } finally {
    client.end();
  }
}

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end())