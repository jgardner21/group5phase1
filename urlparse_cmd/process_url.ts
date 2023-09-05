
export default function get_metric_scores(filename: string) {

    if(filename.charAt(0) != "/") {
        console.log("Invalid  command")
    }
    else {
        console.log(`Parse success with filename ${filename}`);
    }
    //Step 1: Open file

        //Step 1.1: Verify file exists, return error if it doesn't

    //Step 2: Parse through each line of the file, extract URL information

        //Step 2.1: Return error if file has improper formatting

        //****Do we want to fully quit execution if a non-npmjs or GitHub link is in the file****

        //Step 2.2: Determine if link is npmjs or GitHub

            //Step 2.2.1: If GitHub, just pass along owner and repo fields to metric_calc function

            //Step 2.2.2: If npmjs, need to try at get GitHub link. If we can, proceed to 2.2.1, otherwise return the abbreviated scores and an error msg

}