
set EXTRA_ARGS=
:set EXTRA_ARGS=--inspect-brk
set EXTRA_ARGS=--inspect=:9228
node %EXTRA_ARGS% --experimental-loader=sack.vfs/import.mjs  server/server.mjs
%0
