import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Note } from '../interfaces/note.interface';

@Injectable({
  providedIn: 'root',
})
export class NoteListService {
  firestore: Firestore = inject(Firestore);

  trashNotes: Note[] = [];
  normalNotes: Note[] = [];
  markedNotes: Note[] = [];

  unsubTrash;
  unsubNote;
  unsubMarkedNotes;

  constructor() {
    this.unsubTrash = this.subTrashList();
    this.unsubNote = this.subNotesList();
    this.unsubMarkedNotes = this.subMarkedNotesList();
  }

  async addNote(item: Note, collId: 'notes' | 'trash') {
    await addDoc(this.getNotesRef(), item)
      .catch((err) => {
        console.error(err);
      })
      .then((docRef) => {
        console.log('Document written with ID: ', docRef);
      });
  }

  async updateNote(note: Note) {
    if(note.id){
      let docRef = this.getSingleDocRef(this.getCollIdFromNote(note), note.id)
      await updateDoc(docRef, this.getCleanJson(note)).catch(
        (err) => { console.log(err); }
      ).then();
    }
  };

  async deleteNote(collId: 'trash' | 'notes', docId: string) {
    await deleteDoc(this.getSingleDocRef(collId, docId)).catch(
      (err) => {console.log(err)}
    )
  }

  getCleanJson(note:Note) {
    return {
      type: note.type,
      title:note.title,
      content: note.content,
      marked: note.marked,
    }
  }

  getCollIdFromNote(note:Note) {
    if(note.type == 'note') {
      return 'notes'
    }
    else {
      return 'trash'
    }
  }

  ngonDestroy() {
    this.unsubTrash();
    this.unsubNote();
    this.unsubMarkedNotes();
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = [];
      list.forEach((element) => {
        this.trashNotes.push(this.setNoteObject(element.data(), element.id));
        console.log(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  subNotesList() {
    const q = query(this.getNotesRef(), limit(100));
    return onSnapshot(q, (list) => {
      this.normalNotes = [];
      list.forEach((element) => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
        console.log(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  subMarkedNotesList() {
    const q = query(this.getNotesRef(), where('marked', '==', true), limit(100));
    return onSnapshot(q, (list) => {
      this.markedNotes = [];
      list.forEach((element) => {
        this.markedNotes.push(this.setNoteObject(element.data(), element.id));
        console.log(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id,
      type: obj.type || 'note',
      title: obj.title || '',
      content: obj.content || '',
      marked: obj.marked || false,
    };
  }

  getTrashRef() {
    return collection(this.firestore, 'trash');
  }

  getNotesRef() {
    return collection(this.firestore, 'notes');
  }

  getSingleDocRef(collId: string, docId: string) {
    return doc(collection(this.firestore, collId), docId);
  }
}
