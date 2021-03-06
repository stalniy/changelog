import test from 'ava';
import {outputFile, readFile} from 'fs-extra';
import {stub} from 'sinon';
import clearModule from 'clear-module';
import tempy from 'tempy';

// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(t => {
  // Change current working directory to a temp directory
  process.chdir(tempy.directory());
  // Clear npm cache to refresh the module state
  clearModule('..');
  t.context.m = require('..');
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test.afterEach.always(() => {
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Verify "changelogFile"', async t => {
  const changelogFile = 'docs/changelog.txt';
  const notes = 'Test release note';

  await t.notThrows(t.context.m.verifyConditions({changelogFile}, {nextRelease: {notes}, options: {}}));
});

test.serial('Create new CHANGELOG.md', async t => {
  const changelogFile = 'docs/changelog.txt';
  const notes = 'Test release note';

  await t.context.m.prepare({changelogFile}, {nextRelease: {notes}, logger: t.context.logger});

  // Verify the content of the CHANGELOG.md
  t.is((await readFile(changelogFile)).toString(), `${notes}\n`);

  t.deepEqual(t.context.log.args[0], ['Create %s', changelogFile]);
});

test.serial('Skip changelog update is the release is empty', async t => {
  await outputFile('CHANGELOG.md', 'Initial CHANGELOG');

  await t.context.m.prepare({}, {nextRelease: {}, options: {}, logger: t.context.logger});

  // Verify the content of the CHANGELOG.md
  t.is((await readFile('CHANGELOG.md')).toString(), 'Initial CHANGELOG');
});

test.serial('Verify only on the fist call', async t => {
  const changelogFile = 'docs/changelog.txt';
  const notes = 'Test release note';

  await t.context.m.verifyConditions(
    {changelogFile},
    {nextRelease: {notes}, options: {prepare: ['@semantic-release/git']}}
  );
  await t.context.m.prepare({changelogFile}, {nextRelease: {notes}, logger: t.context.logger});

  // Verify the content of the CHANGELOG.md
  t.is((await readFile(changelogFile)).toString(), `${notes}\n`);

  t.deepEqual(t.context.log.args[0], ['Create %s', changelogFile]);
});

test('Throw SemanticReleaseError if prepare "changelogFile" option is not a string', async t => {
  const changelogFile = 42;
  const errors = [
    ...(await t.throws(
      t.context.m.verifyConditions(
        {},
        {options: {prepare: ['@semantic-release/git', {path: '@semantic-release/changelog', changelogFile}]}}
      )
    )),
  ];

  t.is(errors[0].name, 'SemanticReleaseError');
  t.is(errors[0].code, 'EINVALIDCHANGELOGFILE');
});
