import { Book } from './BookModel';
import { Comment } from './CommentModel';
import { Notebook } from './NotebookModel';
import { Post } from './PostModel';
import { User } from './UserModel';

export function initModels(): void {
  Book.hasMany(Post, { as: 'posts', foreignKey: 'book_id' });
  Book.hasMany(Notebook, { as: 'notebook', foreignKey: 'book_id' });

  User.hasMany(Post, { as: 'posts', foreignKey: 'user_id' });
  User.hasMany(Comment, { as: 'comments', foreignKey: 'user_id' });
  User.hasMany(Notebook, { as: 'notebook', foreignKey: 'user_id' });

  Post.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
  Post.belongsTo(Book, { as: 'book', foreignKey: 'book_id' });
  Post.hasMany(Comment, { as: 'comments', foreignKey: 'post_id' });

  Notebook.belongsTo(Book, { as: 'book', foreignKey: 'book_id' });
  Notebook.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

  Comment.belongsTo(Post, { as: 'post', foreignKey: 'post_id' });
  Comment.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
}
