Documentation
=============

Please see [http://golf.github.com/](http://golf.github.com/).

Pre-built Binaries
==================

Download them from [here](http://github.com/golf/golf/downloads).

Build From Source
=================

1. Clone the git repo.

        $ git clone git://github.com/golf/golf.git

2. Compile Golf, produce the `golf.zip` file, and install:
        
        $ cd golf
        $ ant install

3. You will be prompted for a directory to copy the jar file and the wrapper script to. Choose a directory that is in your path. Now you should be able to run Golf.

        $ golf --help

Javadocs
========

The javadocs can be generated the usual way:

       $ ant javadoc
