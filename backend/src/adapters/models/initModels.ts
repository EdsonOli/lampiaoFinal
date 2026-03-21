import { Book } from './BookModel';
import { BookSeries } from './BookSeriesModel';
import { BookSeriesEntry } from './BookSeriesEntryModel';
import { Comment } from './CommentModel';
import { CommentRelevanceVote } from './CommentRelevanceVoteModel';
import { Notebook } from './NotebookModel';
import { Post } from './PostModel';
import { PostDraft } from './PostDraftModel';
import { User } from './UserModel';

export function initModels(): void {
  Book.hasMany(Post, { as: 'posts', foreignKey: 'book_id' });
  Book.hasMany(PostDraft, { as: 'postDrafts', foreignKey: 'book_id' });
  Book.hasMany(Notebook, { as: 'notebook', foreignKey: 'book_id' });
  Book.hasMany(BookSeriesEntry, { as: 'seriesEntries', foreignKey: 'bookId' });
  Book.belongsToMany(BookSeries, {
    through: BookSeriesEntry,
    as: 'series',
    foreignKey: 'bookId',
    otherKey: 'seriesId',
  });

  BookSeries.hasMany(BookSeriesEntry, { as: 'entries', foreignKey: 'seriesId' });
  BookSeries.belongsToMany(Book, {
    through: BookSeriesEntry,
    as: 'books',
    foreignKey: 'seriesId',
    otherKey: 'bookId',
  });

  BookSeriesEntry.belongsTo(Book, { as: 'book', foreignKey: 'bookId' });
  BookSeriesEntry.belongsTo(BookSeries, { as: 'series', foreignKey: 'seriesId' });

  User.hasMany(Post, { as: 'posts', foreignKey: 'user_id' });
  User.hasMany(PostDraft, { as: 'postDrafts', foreignKey: 'user_id' });
  User.hasMany(Comment, { as: 'comments', foreignKey: 'user_id' });
  User.hasMany(CommentRelevanceVote, { as: 'commentRelevanceVotes', foreignKey: 'user_id' });
  User.hasMany(Notebook, { as: 'notebook', foreignKey: 'user_id' });

  Post.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
  Post.belongsTo(Book, { as: 'book', foreignKey: 'book_id' });
  Post.hasMany(Comment, { as: 'comments', foreignKey: 'post_id' });

  PostDraft.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
  PostDraft.belongsTo(Book, { as: 'book', foreignKey: 'book_id' });

  Notebook.belongsTo(Book, { as: 'book', foreignKey: 'book_id' });
  Notebook.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

  Comment.belongsTo(Post, { as: 'post', foreignKey: 'post_id' });
  Comment.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
  Comment.belongsTo(Comment, { as: 'parentComment', foreignKey: 'parent_comment_id' });
  Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parent_comment_id' });
  Comment.hasMany(CommentRelevanceVote, { as: 'relevanceVotes', foreignKey: 'comment_id' });

  CommentRelevanceVote.belongsTo(Comment, { as: 'comment', foreignKey: 'comment_id' });
  CommentRelevanceVote.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
}
