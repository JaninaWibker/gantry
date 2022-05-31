#/bin/sh
uid="$1"
cwd="$2"
cmd="$3"
echo -e "setpriv --reuid=$uid --regid=$uid --init-groups --reset-env sh -c \"cd \"$cwd\" && $cmd\"" | chroot /host
