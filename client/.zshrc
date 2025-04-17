export OPENCV_DIR=/opt/homebrew/opt/opencv
export OPENCV_INCLUDE_DIR=$OPENCV_DIR/include/opencv4
export PKG_CONFIG_PATH=$OPENCV_DIR/lib/pkgconfig:$PKG_CONFIG_PATH
export LIBRARY_PATH=$OPENCV_DIR/lib:$LIBRARY_PATH
export LD_LIBRARY_PATH=$OPENCV_DIR/lib:$LD_LIBRARY_PATH
export CPLUS_INCLUDE_PATH=$OPENCV_INCLUDE_DIR:$CPLUS_INCLUDE_PATH
export C_INCLUDE_PATH=$OPENCV_INCLUDE_DIR:$C_INCLUDE_PATH






export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
eval "$(/opt/homebrew/bin/brew shellenv)"
export PATH="/opt/homebrew/bin:$PATH"
export PATH=$(npm config get prefix)/bin:$PATH

# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('/opt/anaconda3/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/opt/anaconda3/etc/profile.d/conda.sh" ]; then
        . "/opt/anaconda3/etc/profile.d/conda.sh"
    else
        export PATH="/opt/anaconda3/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<

