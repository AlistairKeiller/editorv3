import { VM } from 'doppiojvm';

const fs = BrowserFS.BFSRequire('fs'),
  path = BrowserFS.BFSRequire('path'),
  Buffer = BrowserFS.BFSRequire('buffer').Buffer,
  process = BrowserFS.BFSRequire('process');

function copyDir(src, dest) {
  fs.mkdir(dest, (e) => {
    fs.readdir(src, (e, files) => {
      files.forEach((file) => {
        var srcFile = path.resolve(src, file),
          destFile = path.resolve(dest, file);
        fs.stat(srcFile, (e, stat) => {
          stat.isDirectory()
            ? copyDir(srcFile, destFile)
            : fs.readFile(srcFile, (e, data) => {
                fs.writeFile(destFile, data);
              });
        });
      });
    });
  });
}

fetch('doppio.zip')
  .then((d) => d.arrayBuffer())
  .then((d) => {
    var mfs = new BrowserFS.FileSystem.MountableFileSystem();
    mfs.mount('/zip', new BrowserFS.FileSystem.ZipFS(new Buffer(d)));
    mfs.mount('/home', new BrowserFS.FileSystem.InMemory());
    mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());
    BrowserFS.initialize(mfs);
    copyDir('/zip', '/home');
    postMessage(['changeButton', 'runButton']);
    mfs.umount('/zip');
  });

var stderr;
process.initializeTTYs();
process.stdout.on('data', (d) => {
  postMessage(['out', d.toString()]);
});
process.stderr.on('data', (d) => {
  stderr = true;
  postMessage(['out', d.toString()]);
});

onmessage = (e) => {
  switch (e.data[0]) {
    case 'compileAndRun':
      fs.writeFile('/tmp/Main.java', e.data[1], () => {
        stderr = false;
        VM.CLI(
          ['/home/Javac', '/tmp/Main.java'],
          { doppioHomePath: '/home' },
          () => {
            if (stderr) postMessage(['changeButton', 'runButton']);
            else {
              postMessage(['changeButton', 'runningButton']);
              VM.CLI(
                ['/tmp/Main'],
                { doppioHomePath: '/home', classpath: ['/tmp'] },
                () => postMessage(['changeButton', 'runButton'])
              );
            }
          }
        );
      });
      break;
    case 'in':
      process.stdin.write(e.data[1] + '\n');
      break;
    default:
      console.log('default in worker from: ' + e.data);
  }
};
