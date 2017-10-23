import { FileViewer } from 'Components/file-viewer/file-viewer.component';
import { Logger } from 'Logger/logger';
/**
 * Job che si occupa di scrivere stringhe di grosse dimensione sul FileViewer, dividendo la stringa
 * in chunk di stringhe piu piccole
 */
export class FileViewerWriterJob {
  private logger: Logger = new Logger(this.constructor.name);

  /** setInterval che si occupa di scrivere sul file viewer */
  private job: number = null;
  /** coda di stringhe da scrivere nel file viewer */
  private queue: Array<Array<string>> = [];
  /** contatore per la seguente coda */
  private counter: number = 0;
  /** intervall di tempo tra una scrittura di un chunk ed un'altra */
  private readonly SLEEP_TIME: number = 1000; //ms -> 1 secondo
  /** dimensione massima del chunk della stringa da scrivere sul viewer */
  private readonly MAX_CHUNK_SIZE: number = 2000; //righe

  /** Callback called on job start */
  private _onWriteJobStart: () => void = () => {};
  /** Callback called on job end */
  private _onWriteJobEnd: () => void = () => {};

  private fileViewer: FileViewer;

  constructor(fileViewer: FileViewer) {
    if(!fileViewer) {
      throw new Error("FileViewer e null");
    }
    this.fileViewer = fileViewer;
  }

  /**
   * Scrive la stringa in input sul FileViewer, dividendo la stringa in chunk di grandezza uguale a MAX_CHUNK_SIZE.
   * Tra una scrittura di un chunk e l'altra interoccorre il tempo SLEEP_TIME
   * Se il job sta gia scrivendo una stringa, la stringa in input viene comunque divisa in chunk che vengono accodati
   * a quelli che il job sta gia scrivendo
   */
  public writeText(toWrite: string | Array<String>) {
    if(toWrite && typeof toWrite === "string") {
      toWrite = [toWrite];
    }
    if(!Array.isArray(toWrite)) {
      throw new TypeError('Il testo da scrivere deve essere una stringa o un array di stringhe');
    }
    let toWriteArray: Array<string> = <Array<string>> toWrite;
    this.logger.debug("Richiesto l\'inserimento di una stringa di %i righe", toWriteArray.length);
    let toWriteArrayChunked: Array<Array<string>> = this.chunkArray(toWriteArray);
    this.queue = this.queue.concat(toWriteArrayChunked);
    this.logger.debug("Dopo aver inserito %i chunk in coda, ci sono %i chunk da scrivere", toWriteArray.length, this.queue.length);
    //Se il job non e gia in esecuzione ne avvia uno nuovo
    this.startNewJob();
  }

  private chunkArray(toChuck: Array<string>): Array<Array<string>> {
    let result: Array<Array<string>> = [];
    let counter: number = 0;
    let chunk: Array<string> = null;
    toChuck.forEach((e) => {
      if(counter < this.MAX_CHUNK_SIZE) {
        if(chunk === null) {
          chunk = [];
        }
        chunk.push(e);
        counter++;
      } else {
        result.push(chunk);
        chunk = [];
        counter = 1;
        chunk.push(e);
      }
    });
    if(chunk) {
      result.push(chunk);
    }
    this.logger.debug("Il contenuto del file e stato diviso in %s chunk da %i righe l'uno", result.length, this.MAX_CHUNK_SIZE);
    return result;
  }

  /**
   * Interrompe il job se e in esecuzione e reinizializza tutte le variaibili per farlo ripartire da 0
   */
  public terminateJob(): void {
    if(this.job) {
      this.logger.debug("Si sta terminando il job con %i/%i elementi elaborati", this.counter, this.queue.length);
      clearInterval(this.job);
      this.job = null;
      this.counter = 0;
      this.queue = [];
      this.logger.debug("Il job e stato terminato");
      this._onWriteJobEnd();
    }
  }

  /**
   * Avvia un nuovo job se il job corrente non e gia in esecuzioe
   */
  private startNewJob(): void {
    if(!this.job) {
      this.logger.debug("Si sta avviando un nuovo job")
      this._onWriteJobStart();
      this.job = window.setInterval(() => {
        this.jobImpl();
      }, this.SLEEP_TIME);
    }
  }

  private jobImpl(): void {
    if(this.queue.length < 1) {
      this.logger.debug("Non sono stati inseriti elementi da elaborare");
      this.terminateJob();
    } 
    let chunk = this.queue[this.counter];
    this.fileViewer.writeText(chunk);
    this.counter++;
    this.logger.debug("Elaborato elemento %i di %i elementi in coda", this.counter, this.queue.length);
    if(this.counter >= this.queue.length) {
      this.logger.debug("Il job ha elaborato tutti i %i elementi in coda e verra terminato", this.queue.length);
      this.terminateJob();
    }
  }

  public onWriteJobStart(callback: () => void): FileViewerWriterJob {
    if(!callback) {
      callback = () => {};
    }
    this._onWriteJobStart = callback;
    return this;
  }

  public onWriteJobEnd(callback: () => void): FileViewerWriterJob {
    if(!callback) {
      callback = () => {};
    }
    this._onWriteJobEnd = callback;
    return this;
  }
}