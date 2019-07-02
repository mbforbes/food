BEGIN {
    FS=", "
}

{
    if ( $0 ~ /\[-*[0-9]+.*/ ) {
        $1="";
        split($0, arr, "\"");
        if ( arr[3] ~ /,/ ) {
            print "\t\t\t\""arr[2]"\","
        } else {
            print "\t\t\t\""arr[2]"\""
        }

    } else {
        print $0
    }
}
