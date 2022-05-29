#/bin/sh
user="$1"
cwd="$2"
code="$3"
echo -e "sudo -u $user sh -c \"cd \"$cwd\" && $code\"" | chroot /host
