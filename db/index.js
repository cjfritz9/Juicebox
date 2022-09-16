const { Client } = require('pg'); 

const client = new Client('postgres://localhost:5432/juicebox-dev');


const createUser = 
  async ({
  username,
  password,
  name,
  location
}) => {

  try {
    const { rows: [user] } = await client.query(`
      INSERT INTO users (username, password, name, location)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
      RETURNING *
    `, [ username, password, name, location ]); 

    return user;
  } catch (err) {
    throw err;
  }
}

const updateUser = async (id, fields = {}) => {

  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1}`
  ).join(', ');

  if (setString.length === 0) {
    return;
  }

  try {
    const { rows: [user] } = await client.query(`
      UPDATE users
      SET ${ setString }
      WHERE id = ${ id }
      RETURNING *;
    `, Object.values(fields));

    return user;
  } catch (err) {
    throw err;
  }
}

const getAllUsers = async () => {
    const { rows } = await client.query(`
        SELECT id, username
        FROM users;
        `);

        return rows;
}

const getUserById = async (userId) => {
  try {
  const { rows: [user] } = await client.query(`
    SELECT id, username, name, location, active
    FROM users
    WHERE id = ${ userId }
  `);

  !user ? null : user.posts = await getPostsByUser(userId)

  return user;

  } catch (err) {
    throw err;
  }
} 

const createPost = async ({ 
  authorId,
  title,
  content
}) => {
  try {
    const { rows: [post] } = await client.query(`
    INSERT INTO posts("authorId", title, content)
    VALUES ($1, $2, $3)
    RETURNING *;
  `, [ authorId, title, content ]); 

  return post;
  } catch (err) {
    throw err;
  }
}

const updatePost = async (id, fields = {}) => {

    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1}`
    ).join(', ');
  
    if (setString.length === 0) {
      return;
    }
  
    try {
      const { rows: [post] } = await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id = ${ id }
        RETURNING *;
      `, Object.values(fields));
  
      return post;
  } catch (err) {
    throw err;
  }
}

const getAllPosts = async () => {
  try {
    const { rows } = await client.query(`
    SELECT *
    FROM posts;
    `);

    return rows;

  } catch (err) {
    throw err;
  }
}

const getPostsByUser = async (userId) => {
  try {
    const { rows: postIds } = await client.query(`
    SELECT id
    FROM posts
    WHERE "authorId" = ${ userId };
    `);

    const posts = await Promise.all(postIds.map(
      post => getPostById( post.id )
    ));

    return posts;
  } catch (err) {
    throw err;
  }
}

const getPostById = async (postId) => {
  try {
    const { rows: [ post ] } = await client.query(`
      SELECT * 
      FROM posts
      WHERE id=$1;
    `, [postId]);

    const { rows: tags } = await client.query(`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `, [postId]);

    const { rows: [ author ] } = await client.query(`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `, [post.authorId]);

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (err) {
    throw err;
  }
}


const createTags = async (tagList) => {
  if (tagList.length === 0) { 
    return; 
  }

  const insertValues = tagList.map(
    (_, index) => `$${index + 1}`).join('), (');
//                                 add multiple rows
// ['#awesome', '#cool', '#rad']
// ['$1', '$2', '$3']
// '$1), ($2), ($3'
// three seperate rows, single column

  const selectValues = tagList.map(
    (_, index) => `$${index + 1}`).join(', ');
//                                 add multiple columns

// ['#awesome', '#cool', '#rad']
// ['$1', '$2', '$3']
// '$1, $2, $3'
// three seperate columns, single row

  try {
    await client.query(`
      INSERT INTO tags(name)
      VALUES (${ insertValues })
      ON CONFLICT (name) DO NOTHING;
    `, tagList);

    // ON CONFLICT: don't insert new tag

    const { rows } = await client.query(`
      SELECT (name)
      FROM tags
      WHERE (name) IN (${ selectValues });
    `, tagList);
    console.log(rows)
    return rows;
  } catch (err) {
    throw err;
  }
}

const createPostTag = async (postId, tagId) => {
  console.log("TAG ID:", tagId)
  try {
    await client.query(`
      INSERT INTO post_tags ("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
  } catch (err) {
    throw err;
  }
} 


const addTagsToPost = async (postId, tagList) => {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);
    
    return await getPostById(postId);
  } catch (err) {
    throw err;
  }
}



module.exports = {
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
  createPostTag,
  addTagsToPost,
}